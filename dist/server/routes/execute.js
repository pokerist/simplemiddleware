"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = executeRoutes;
const client_1 = require("../hikcentral/client");
const uuid_1 = require("uuid");
async function executeRoutes(fastify) {
    fastify.post('/api/execute', async (request, reply) => {
        const requestId = (0, uuid_1.v4)();
        const startTime = Date.now();
        const { endpoint, payload } = request.body;
        // Default to POST if payload exists, otherwise GET? 
        // The prompt example shows POST /api/execute with payload.
        // The target endpoint "/artemis/api/resource/v1/person/single/add" is definitely a POST.
        // But what if user wants to GET? 
        // We can infer method: if payload is non-empty object -> POST.
        // Or we can let UI send method. 
        // The prompt UI requirements just say "Input field for HikCentral endpoint" and "JSON editor".
        // It doesn't explicitly mention a Method selector.
        // BUT "Search Person" preset implies GET or POST with search criteria.
        // HikCentral Search is usually POST with search criteria.
        // Most HikCentral "Action" APIs are POST.
        // I will default to POST. If we need GET, we can add logic.
        // Actually, to be safe, I'll default to POST as most "execute" things are operations.
        // Wait, the `ExecuteRequest` interface I made has `method`. I should use it if provided.
        const method = request.body.method || 'POST';
        console.log(`[${requestId}] Incoming Execute Request: ${method} ${endpoint}`);
        if (!endpoint) {
            return reply.code(400).send({ error: 'Endpoint is required' });
        }
        try {
            const response = await client_1.hikClient.execute(endpoint, method, payload || {});
            const duration = Date.now() - startTime;
            console.log(`[${requestId}] Success (${duration}ms): Status ${response.status}`);
            return reply.code(200).send({
                requestId,
                duration,
                hikStatus: response.status,
                hikStatusText: response.statusText,
                data: response.data
            });
        }
        catch (error) {
            const duration = Date.now() - startTime;
            console.error(`[${requestId}] Error (${duration}ms):`, error.message);
            return reply.code(502).send({
                requestId,
                error: 'Failed to communicate with HikCentral',
                details: error.message
            });
        }
    });
}
