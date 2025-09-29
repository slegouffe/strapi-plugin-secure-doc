import type { Core } from '@strapi/strapi';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  async check(ctx) {
    console.log('********* check *********');
    const { email, docId } = ctx.request.params;
    if (!email || !docId) return ctx.badRequest('email & docId required');

    try {
      strapi.plugin('secure-doc').services.cryptoService.decrypt(email);
    } catch (e) {
      const docIdDecrypted = strapi.plugin('secure-doc').services.cryptoService.decrypt(docId);
      return ctx.badRequest(
        'email',
        strapi.plugin('secure-doc').services.cryptoService.encrypt(docIdDecrypted.data, { ttlSeconds: 60 * 60 })
      );
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
  async checkEmail(ctx) {
    const { email, docId } = ctx.request.body;
    if (!email || !docId) return ctx.badRequest('email & docId required');
    try {
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: {
          email
        },
        populate: ['commune']
      });
      if (!user || !user.commune) return ctx.badRequest('email');

      const encryptedEmail = strapi.plugin('secure-doc').services.cryptoService.encrypt(user.email, { ttlSeconds: parseInt(process.env.TTL_EMAIL, 10) });
      const decryptedDoc = strapi.plugin('secure-doc').services.cryptoService.decrypt(docId);

      const file = await strapi.db.query("plugin::upload.file").findOne({
        where: { 
          documentId: decryptedDoc.data
        },
      });

      const elus = await strapi.db.query("api::elu.elu").findMany({
        where: {
          codeInsee: user.commune.codeInsee
        },
        populate: ['documents']
      });
      const isFileOwner = elus.filter(elu => (elu.documents && elu.documents.some(document => document.id === file.id)));
      
      if (isFileOwner.length === 0) return ctx.badRequest('email');
      
      const url = {
        name: file.name,
        link: `${process.env.FRONT_URL}/documents/${encryptedEmail}/${docId}`
      };
      console.log(url);
      return ctx.send(200);
    } catch (e) {
      console.log(e);
      return ctx.badRequest('email');
    }
    return ctx.send({ message: 'Email verified' });
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


