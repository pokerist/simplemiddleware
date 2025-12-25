import crypto from 'crypto';

interface SignOptions {
  method: string;
  accept: string;
  contentType: string;
  path: string;
  appKey: string;
  appSecret: string;
  nonce: string;
  timestamp: string;
  body?: any;
}

export class HikCentralSigner {
  static calculateContentMD5(body: any): string {
    if (!body || (typeof body === 'object' && Object.keys(body).length === 0)) {
      return '';
    }
    const content = typeof body === 'string' ? body : JSON.stringify(body);
    return crypto.createHash('md5').update(content).digest('base64');
  }

  static sign(options: SignOptions): string {
    const {
      method,
      accept,
      contentType,
      path,
      appKey,
      appSecret,
      nonce,
      timestamp,
      body
    } = options;

    const contentMd5 = this.calculateContentMD5(body);
    const date = ''; // HikCentral Artemis often leaves Date empty in string to sign if x-ca-timestamp is used, but prompt says "Date + \n". Let's check if it needs to be empty or real date. 
    // Usually Artemis protocol uses standard HTTP Date header if present. If not, empty string.
    // The prompt shows "Date + \n". If we don't send Date header, it is empty string.
    // We will assume standard Artemis behavior: If we don't set 'Date' header, this line is empty.
    
    // Construct String to Sign exactly as requested:
    // STRING_TO_SIGN = 
    // METHOD + "\n" + 
    // Accept + "\n" + 
    // Content-MD5 + "\n" + 
    // Content-Type + "\n" + 
    // Date + "\n" + 
    // "x-ca-key:" + X-Ca-Key + "\n" + 
    // "x-ca-nonce:" + X-Ca-Nonce + "\n" + 
    // "x-ca-timestamp:" + X-Ca-Timestamp + "\n" + 
    // REQUEST_URI

    const headersToSign = 
      `x-ca-key:${appKey}\n` +
      `x-ca-nonce:${nonce}\n` +
      `x-ca-timestamp:${timestamp}\n`;

    const stringToSign = 
      method.toUpperCase() + '\n' +
      accept + '\n' +
      contentMd5 + '\n' +
      contentType + '\n' +
      date + '\n' +
      headersToSign +
      path;

    // console.log('String to Sign:\n' + stringToSign.replace(/\n/g, '\\n\n'));

    const hmac = crypto.createHmac('sha256', appSecret);
    hmac.update(stringToSign);
    return hmac.digest('base64');
  }
}
