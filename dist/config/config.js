"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env from root
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
exports.config = {
    hikcentral: {
        baseUrl: process.env.HIK_BASE_URL || 'https://127.0.0.1:443',
        appKey: process.env.HIK_APP_KEY || '',
        appSecret: process.env.HIK_APP_SECRET || '',
        userId: process.env.HIK_USER_ID,
        verifySsl: process.env.HIK_VERIFY_SSL === 'true',
    },
    server: {
        port: parseInt(process.env.PORT || '3000', 10),
    },
};
if (!exports.config.hikcentral.appKey || !exports.config.hikcentral.appSecret) {
    console.warn('WARNING: HIK_APP_KEY or HIK_APP_SECRET is missing in .env');
}
