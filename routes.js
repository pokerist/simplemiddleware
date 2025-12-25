const express = require('express');
const router = express.Router();
const db = require('./db');
const hikcentral = require('./hikcentral');

// Helper to run DB queries as promises
const runQuery = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

const getQuery = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const allQuery = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// --- Residents ---

// Create Resident
router.post('/residents/create', async (req, res) => {
    const { ownerId, fullName, email } = req.body;
    
    if (!ownerId || !fullName) {
        return res.status(400).json({ error: 'ownerId and fullName are required' });
    }

    try {
        // 1. Check if exists locally
        const existing = await getQuery('SELECT * FROM users WHERE lyve_owner_id = ?', [ownerId]);
        if (existing) {
            return res.status(400).json({ error: 'User already exists locally' });
        }

        // 2. Insert locally first (as per "Local Database = Brain")
        await runQuery(
            'INSERT INTO users (lyve_owner_id, full_name, email) VALUES (?, ?, ?)',
            [ownerId, fullName, email]
        );

        // 3. Call HikCentral
        const hikBody = {
            personName: fullName,
            email: email || '',
            // Mapping lyve_owner_id to personCode or externalId could be useful, 
            // but prompt says "hikPersonCode" comes back from response.
            // We'll let HikCentral generate ID if possible, or pass ownerId as code if allowed.
            // Prompt example Request doesn't show structure sent to Hik.
            // We will use minimal required fields for 'person/single/add'.
            // Usually requires personName, orgIndexCode (default root?).
            // Let's assume root org or handle error.
            // For now, simple payload.
            orgIndexCode: 'root000000', // Common default
        };

        const hikRes = await hikcentral.request('POST', '/artemis/api/resource/v1/person/single/add', hikBody);

        if (hikRes.code === '0' && hikRes.data) {
            const { personId, personCode } = hikRes.data;
            
            // 4. Update local DB
            await runQuery(
                'UPDATE users SET hik_person_id = ?, hik_person_code = ? WHERE lyve_owner_id = ?',
                [personId, personCode || personId, ownerId] // fallback if code missing
            );

            res.json({
                success: true,
                hikPersonId: personId,
                hikPersonCode: personCode
            });
        } else {
            // Failed in HikCentral, but saved locally. 
            // Should we rollback? "Local Database = Brain".
            // We can keep it but return error warning.
            res.json({
                success: false,
                message: 'Saved locally but HikCentral failed',
                hikResponse: hikRes
            });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get Resident
router.get('/residents/:ownerId', async (req, res) => {
    try {
        const user = await getQuery('SELECT * FROM users WHERE lyve_owner_id = ?', [req.params.ownerId]);
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// List all Residents (for UI)
router.get('/residents', async (req, res) => {
    try {
        const users = await allQuery('SELECT * FROM users');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Dynamic QR
router.post('/residents/qr', async (req, res) => {
    const { ownerId } = req.body;
    try {
        const user = await getQuery('SELECT * FROM users WHERE lyve_owner_id = ?', [ownerId]);
        if (!user || !user.hik_person_id) {
            return res.status(400).json({ error: 'User not found or not synced with HikCentral' });
        }

        // HikCentral API for QR
        const hikBody = {
            personId: user.hik_person_id
        };
        
        const hikRes = await hikcentral.request('POST', '/artemis/api/resource/v1/person/dynamicqrcode/get', hikBody);
        
        res.json(hikRes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Resident
router.post('/residents/delete', async (req, res) => {
    const { ownerId } = req.body;
    try {
        await runQuery('DELETE FROM users WHERE lyve_owner_id = ?', [ownerId]);
        res.json({ success: true, message: 'Deleted locally' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Visitors ---

// Create Visitor
router.post('/visitors/create', async (req, res) => {
    const { userId, visitorName, visitStart, visitEnd } = req.body;
    try {
        await runQuery(
            'INSERT INTO visitors (user_id, visitor_name, visit_start, visit_end) VALUES (?, ?, ?, ?)',
            [userId, visitorName, visitStart, visitEnd]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// List Visitors
router.get('/visitors', async (req, res) => {
    try {
        const visitors = await allQuery(`
            SELECT v.*, u.full_name as host_name 
            FROM visitors v 
            LEFT JOIN users u ON v.user_id = u.id
        `);
        res.json(visitors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Test Endpoints ---

// Test Auth
router.post('/test/auth', async (req, res) => {
    // Try a simple call, e.g., get person list or just a dummy call
    // Using a safe endpoint: /artemis/api/resource/v1/person/personList (if available) or just invalid one to check auth code.
    // Prompt says "Button: Test Authentication".
    // We can try to fetch something generic.
    // Or just use the 'raw' handler.
    // Let's try to fetch a non-existent person to verify 200 OK vs 401.
    // Actually, let's use a raw request logic here for simplicity or define a specific test.
    // I'll try to create a dummy request.
    try {
         // Usually there is a "capabilities" or "version" endpoint, but we don't know it.
         // We will try to search for a random person.
         // Or just return "Use Raw API Tester" if unsure.
         // But user wants a button.
         // I'll use a likely safe endpoint.
         const hikRes = await hikcentral.request('POST', '/artemis/api/resource/v1/person/personList', {
             pageNo: 1, pageSize: 1
         });
         res.json(hikRes);
    } catch (err) {
        res.status(500).json({ error: err.message, details: err.response ? err.response.data : null });
    }
});

// Raw API
router.post('/test/raw', async (req, res) => {
    const { method, path, body } = req.body;
    try {
        const hikRes = await hikcentral.request(method, path, body);
        res.json(hikRes);
    } catch (err) {
        res.status(500).json({ error: err.message, details: err.response ? err.response.data : null });
    }
});

module.exports = router;
