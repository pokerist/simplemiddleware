"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hikClient = exports.HikCentralClient = void 0;
const axios_1 = __importDefault(require("axios"));
const https_1 = __importDefault(require("https"));
const uuid_1 = require("uuid");
const config_1 = require("../../config/config");
const signer_1 = require("./signer");
class HikCentralClient {
    client;
    constructor() {
        this.client = axios_1.default.create({
            baseURL: config_1.config.hikcentral.baseUrl,
            timeout: 30000,
            httpsAgent: new https_1.default.Agent({
                rejectUnauthorized: config_1.config.hikcentral.verifySsl,
            }),
            validateStatus: () => true, // Handle all status codes manually
        });
    }
    async execute(endpoint, method, payload) {
        const timestamp = Date.now().toString();
        const nonce = (0, uuid_1.v4)();
        const appKey = config_1.config.hikcentral.appKey;
        const appSecret = config_1.config.hikcentral.appSecret;
        const accept = '*/*';
        const contentType = 'application/json';
        // Calculate MD5 for the header (and for signing)
        const contentMd5 = signer_1.HikCentralSigner.calculateContentMD5(payload);
        // Generate Signature
        const signature = signer_1.HikCentralSigner.sign({
            method,
            accept,
            contentType,
            path: endpoint,
            appKey,
            appSecret,
            nonce,
            timestamp,
            body: payload
        });
        const headers = {
            'Accept': accept,
            'Content-Type': contentType,
            'x-ca-key': appKey,
            'x-ca-signature': signature,
            'x-ca-timestamp': timestamp,
            'x-ca-nonce': nonce,
            'x-ca-signature-headers': 'x-ca-key,x-ca-nonce,x-ca-timestamp',
        };
        if (contentMd5) {
            headers['Content-MD5'] = contentMd5;
        }
        // If HIK_USER_ID is present, some APIs might need it? 
        // Usually it's not part of standard Artemis signing unless specified.
        // We'll leave it out unless we know where it goes (maybe path param or header?).
        // The prompt listed HIK_USER_ID in env but didn't say how to use it. 
        // It's likely for specific payloads, but we won't auto-inject it into headers 
        // unless we know the header name.
        const requestConfig = {
            method: method,
            url: endpoint,
            headers,
            data: payload,
        };
        console.log(`[HikCentral] Request: ${method} ${endpoint}`);
        // console.log('Headers:', JSON.stringify(headers, null, 2));
        try {
            const response = await this.client.request(requestConfig);
            return {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                data: response.data,
            };
        }
        catch (error) {
            console.error('[HikCentral] Request Failed:', error.message);
            throw error;
        }
    }
}
exports.HikCentralClient = HikCentralClient;
exports.hikClient = new HikCentralClient();
