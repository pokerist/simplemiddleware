const axios = require('axios');
const crypto = require('crypto-js');
const { v4: uuidv4 } = require('uuid');
const https = require('https');

require('dotenv').config();

const APP_KEY = process.env.HIKCENTRAL_APP_KEY;
const APP_SECRET = process.env.HIKCENTRAL_APP_SECRET;
const BASE_URL = process.env.HIKCENTRAL_BASE_URL;
const VERIFY_SSL = process.env.HIKCENTRAL_VERIFY_SSL === 'true';

const httpsAgent = new https.Agent({  
  rejectUnauthorized: VERIFY_SSL
});

function computeContentMD5(body) {
    if (!body) return '';
    return crypto.enc.Base64.stringify(crypto.MD5(JSON.stringify(body)));
}

function sign(method, path, headers, body) {
    const accept = headers['Accept'];
    const contentType = headers['Content-Type'];
    const contentMd5 = headers['Content-MD5'] || '';
    
    // Headers involved in signature
    // x-ca-key, x-ca-nonce, x-ca-timestamp
    const xCaKey = headers['x-ca-key'];
    const xCaNonce = headers['x-ca-nonce'];
    const xCaTimestamp = headers['x-ca-timestamp'];

    // Construct String-To-Sign
    let stringToSign = `${method}\n`;
    stringToSign += `${accept}\n`;
    
    if (contentMd5) {
        stringToSign += `${contentMd5}\n`;
    }
    
    stringToSign += `${contentType}\n`;
    
    // Custom headers sorted
    stringToSign += `x-ca-key:${xCaKey}\n`;
    stringToSign += `x-ca-nonce:${xCaNonce}\n`;
    stringToSign += `x-ca-timestamp:${xCaTimestamp}\n`;
    
    stringToSign += path;

    console.log('--- String To Sign ---\n' + stringToSign + '\n----------------------');

    const signature = crypto.HmacSHA256(stringToSign, APP_SECRET).toString(crypto.enc.Base64);
    return signature;
}

async function request(method, path, body = null) {
    const url = `${BASE_URL}${path}`;
    const nonce = uuidv4();
    const timestamp = Date.now().toString();

    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json;charset=UTF-8',
        'x-ca-key': APP_KEY,
        'x-ca-nonce': nonce,
        'x-ca-timestamp': timestamp,
        'X-Ca-Signature-Headers': 'x-ca-key,x-ca-nonce,x-ca-timestamp'
    };

    if (body) {
        headers['Content-MD5'] = computeContentMD5(body);
    }

    const signature = sign(method.toUpperCase(), path, headers, body);
    headers['X-Ca-Signature'] = signature;

    try {
        const response = await axios({
            method: method,
            url: url,
            headers: headers,
            data: body,
            httpsAgent: httpsAgent
        });
        return response.data;
    } catch (error) {
        console.error('HikCentral Request Error:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
            return error.response.data;
        }
        throw error;
    }
}

module.exports = {
    request
};
