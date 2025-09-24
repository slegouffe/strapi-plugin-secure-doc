import type { Core } from '@strapi/strapi';

import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const KEY_ENV = process.env.OBFUSCATION_KEY; // 32 bytes (base64 or hex) stockée dans tes secrets
if (!KEY_ENV) {
  console.warn('Warning: OBFUSCATION_KEY not set. Set a strong 32-byte key in env.');
}

const cryptoService = ({ strapi }: { strapi: Core.Strapi }) => ({
  base64urlEncode(buf) {
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
  base64urlDecode(str) {
    // pad base64
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return Buffer.from(str, 'base64');
  },
  getKey() {
    if (!KEY_ENV) throw new Error('OBFUSCATION_KEY not configured');
    // try hex
    if (/^[0-9a-fA-F]{64}$/.test(KEY_ENV)) return Buffer.from(KEY_ENV, 'hex');
    // else assume base64
    return Buffer.from(KEY_ENV, 'base64');
  },
  encrypt(data, opts: { ttlSeconds?: number, meta?: any } = {}) {
    const key = this.getKey();
    const iv = crypto.randomBytes(12); // 96-bit IV recommandé pour GCM
    const cipher = crypto.createCipheriv(ALGO, key, iv, { authTagLength: 16 });
  
    // payload : JSON (email + exp + maybe docId)
    const payload = {
      data,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (opts.ttlSeconds || 60 * 60), // default 1h
      meta: opts.meta || null,
    };
    const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
  
    // encode iv|ciphertext|tag en base64url séparés par .
    return [
      this.base64urlEncode(iv),
      this.base64urlEncode(ciphertext),
      this.base64urlEncode(tag)
    ].join('.');
  },
  decrypt(tokenStr) {
    const key = this.getKey();
    const parts = String(tokenStr || '').split('.');
    if (parts.length !== 3) throw new Error('Malformed token');
  
    const iv = this.base64urlDecode(parts[0]);
    const ciphertext = this.base64urlDecode(parts[1]);
    const tag = this.base64urlDecode(parts[2]);
  
    const decipher = crypto.createDecipheriv(ALGO, key, iv, { authTagLength: 16 });
    decipher.setAuthTag(tag);
  
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const payload = JSON.parse(plaintext.toString('utf8'));
  
    // check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      const err = new Error(`Token expired|${payload.data}`);
      throw err;
    }
  
    return payload;
  },
})

export default cryptoService;