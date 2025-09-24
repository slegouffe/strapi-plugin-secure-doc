import type { Core } from '@strapi/strapi';

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET;

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  generateOtp(length = 6) {
    const digits = '0123456789';
    return Array.from({ length }, () => digits[Math.floor(Math.random() * 10)]).join('');
  },
  async verifyOtp(otp, email) {
    const isOtpValid = await strapi.redis.connections.default.client.get(otp);
    if (!isOtpValid || isOtpValid !== email) {
      const err = new Error('OTP invalid');
      throw err;
    }
    await strapi.redis.connections.default.client.del(otp);
    return true;
  }
});

export default service;
