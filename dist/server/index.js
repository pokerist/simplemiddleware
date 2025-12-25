"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const static_1 = __importDefault(require("@fastify/static"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config/config");
const execute_1 = __importDefault(require("./routes/execute"));
const server = (0, fastify_1.default)({
    logger: true // Use Fastify's logger for robust logging
});
// Register Static File Serving for UI
server.register(static_1.default, {
    root: path_1.default.join(__dirname, '../../src/ui'),
    prefix: '/', // Serve at root
});
// Register API Routes
server.register(execute_1.default);
// Health check
server.get('/health', async () => {
    return { status: 'ok' };
});
const start = async () => {
    try {
        const address = await server.listen({ port: config_1.config.server.port, host: '0.0.0.0' });
        console.log(`Server listening at ${address}`);
        console.log(`UI available at http://localhost:${config_1.config.server.port}`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
