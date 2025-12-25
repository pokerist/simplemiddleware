const API_URL = '/api';

function log(elementId, data) {
    const el = document.getElementById(elementId);
    el.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
}

async function testAuth() {
    try {
        const res = await fetch(`${API_URL}/test/auth`, { method: 'POST' });
        const data = await res.json();
        log('authResult', data);
    } catch (err) {
        log('authResult', { error: err.message });
    }
}

async function createResident() {
    const ownerId = document.getElementById('resOwnerId').value;
    const fullName = document.getElementById('resName').value;
    const email = document.getElementById('resEmail').value;

    try {
        const res = await fetch(`${API_URL}/residents/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ownerId, fullName, email })
        });
        const data = await res.json();
        alert(data.success ? 'Resident Created!' : 'Failed: ' + JSON.stringify(data));
        loadResidents();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function loadResidents() {
    try {
        const res = await fetch(`${API_URL}/residents`);
        const users = await res.json();
        
        const tbody = document.querySelector('#residentsTable tbody');
        const select = document.getElementById('visitorHost');
        
        tbody.innerHTML = '';
        select.innerHTML = '';

        users.forEach(u => {
            // Table row
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${u.id}</td>
                <td>${u.lyve_owner_id}</td>
                <td>${u.full_name}</td>
                <td>${u.hik_person_id || 'Not synced'}</td>
                <td>
                    <button class="btn" onclick="getQR('${u.lyve_owner_id}')">Get QR</button>
                    <button class="btn btn-danger" onclick="deleteResident('${u.lyve_owner_id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);

            // Select option
            const opt = document.createElement('option');
            opt.value = u.id;
            opt.textContent = `${u.full_name} (${u.lyve_owner_id})`;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error(err);
    }
}

async function getQR(ownerId) {
    try {
        const res = await fetch(`${API_URL}/residents/qr`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ownerId })
        });
        const data = await res.json();
        
        const resultDiv = document.getElementById('qrResult');
        if (data.data && data.data.uri) {
             resultDiv.innerHTML = `<h3>QR Code:</h3><img src="${data.data.uri}" style="max-width: 200px;" /><br><a href="${data.data.uri}" target="_blank">Download</a>`;
        } else {
             resultDiv.innerHTML = `<h3>Response:</h3><pre>${JSON.stringify(data, null, 2)}</pre>`;
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function deleteResident(ownerId) {
    if (!confirm('Are you sure? This only deletes locally.')) return;
    try {
        await fetch(`${API_URL}/residents/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ownerId })
        });
        loadResidents();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function createVisitor() {
    const userId = document.getElementById('visitorHost').value;
    const visitorName = document.getElementById('visitorName').value;
    
    try {
        const res = await fetch(`${API_URL}/visitors/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userId, 
                visitorName,
                visitStart: new Date().toISOString(), // Simple default
                visitEnd: new Date(Date.now() + 86400000).toISOString() 
            })
        });
        const data = await res.json();
        if (data.success) {
            alert('Visitor Created Locally!');
            loadVisitors();
        } else {
            alert('Error: ' + JSON.stringify(data));
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function loadVisitors() {
    try {
        const res = await fetch(`${API_URL}/visitors`);
        const visitors = await res.json();
        const tbody = document.querySelector('#visitorsTable tbody');
        tbody.innerHTML = '';
        visitors.forEach(v => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${v.id}</td>
                <td>${v.host_name}</td>
                <td>${v.visitor_name}</td>
                <td>${v.visit_start}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
    }
}

async function sendRaw() {
    const method = document.getElementById('rawMethod').value;
    const path = document.getElementById('rawPath').value;
    const bodyStr = document.getElementById('rawBody').value;
    
    let body = null;
    try {
        body = JSON.parse(bodyStr);
    } catch (e) {
        alert('Invalid JSON in body');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/test/raw`, {
            method: 'POST', // Always POST to our proxy
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method, path, body })
        });
        const data = await res.json();
        log('rawResponse', data);
    } catch (err) {
        log('rawResponse', { error: err.message });
    }
}

// Initial load
loadResidents();
loadVisitors();
