import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import https from 'https';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config/config';
import { HikCentralSigner } from './signer';

export class HikCentralClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.hikcentral.baseUrl,
      timeout: 30000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: config.hikcentral.verifySsl,
      }),
      validateStatus: () => true, // Handle all status codes manually
    });
  }

  async execute(endpoint: string, method: string, payload: any) {
    const timestamp = Date.now().toString();
    const nonce = uuidv4();
    const appKey = config.hikcentral.appKey;
    const appSecret = config.hikcentral.appSecret;
    const accept = '*/*';
    const contentType = 'application/json';

    // Calculate MD5 for the header (and for signing)
    const contentMd5 = HikCentralSigner.calculateContentMD5(payload);

    // Generate Signature
    const signature = HikCentralSigner.sign({
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

    const headers: Record<string, string> = {
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

    const requestConfig: AxiosRequestConfig = {
      method: method as any,
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
    } catch (error: any) {
      console.error('[HikCentral] Request Failed:', error.message);
      throw error;
    }
  }
}

export const hikClient = new HikCentralClient();
