import type { Core } from '@strapi/strapi';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  async check(ctx) {
    const { email, docId } = ctx.request.params;
    if (!email || !docId) return ctx.badRequest('email & docId required');

    try {
      strapi.plugin('secure-doc').services.cryptoService.decrypt(email);
    } catch (e) {
      return ctx.badRequest('email');
    }
    
    try {
      const docIdDecrypted = strapi.plugin('secure-doc').services.cryptoService.decrypt(docId);
      const privateUrl = await strapi.service('api::elu.elu').getPrivateUrl(docIdDecrypted.data);
      return ctx.send(privateUrl);
    } catch (e) {
      const error = e.message.split('|');
      if (error[0] === 'Token expired') {
        const emailDecrypted = strapi.plugin('secure-doc').services.cryptoService.decrypt(email);
        const OTP = strapi.plugin('secure-doc').services.otp.generateOtp(4);
        await strapi.redis.connections.default.client.set(OTP, emailDecrypted.data, 'EX', 60 * 60);
        return ctx.badRequest('docId', strapi.plugin('secure-doc').services.cryptoService.encrypt(error[1], { ttlSeconds: 60 * 60 }));
      }
    }
  },
  async verifyOtp(ctx) {
    const { email, otp } = ctx.request.body;
    if (!email || !otp) return ctx.badRequest('email & otp required');
    try {
      const emailDecrypted = strapi.plugin('secure-doc').services.cryptoService.decrypt(email);
      await strapi.plugin('secure-doc').services.otp.verifyOtp(otp, emailDecrypted.data);
    } catch (e) {
      return ctx.badRequest('otp');
    }
    return ctx.send({ message: 'OTP verified' });
  }
});

export default controller;


