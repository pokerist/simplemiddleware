import dotenv from 'dotenv';
import path from 'path';

// Load .env from root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
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

if (!config.hikcentral.appKey || !config.hikcentral.appSecret) {
  console.warn('WARNING: HIK_APP_KEY or HIK_APP_SECRET is missing in .env');
}
