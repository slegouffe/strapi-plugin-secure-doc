import crypto from "crypto";
const bootstrap = ({ strapi }) => {
};
const destroy = ({ strapi }) => {
};
const register = ({ strapi }) => {
};
const config = {
  default: {},
  validator() {
  }
};
const contentTypes = {};
const controller = ({ strapi }) => ({
  async check(ctx) {
    const { email, docId } = ctx.request.params;
    if (!email || !docId) return ctx.badRequest("email & docId required");
    try {
      strapi.plugin("secure-doc").services.cryptoService.decrypt(email);
    } catch (e) {
      return ctx.badRequest("email");
    }
    try {
      const docIdDecrypted = strapi.plugin("secure-doc").services.cryptoService.decrypt(docId);
      const privateUrl = await strapi.service("api::elu.elu").getPrivateUrl(docIdDecrypted.data);
      return ctx.send(privateUrl);
    } catch (e) {
      const error = e.message.split("|");
      if (error[0] === "Token expired") {
        const emailDecrypted = strapi.plugin("secure-doc").services.cryptoService.decrypt(email);
        const OTP = strapi.plugin("secure-doc").services.otp.generateOtp(4);
        await strapi.redis.connections.default.client.set(OTP, emailDecrypted.data, "EX", 60 * 60);
        return ctx.badRequest("docId", strapi.plugin("secure-doc").services.cryptoService.encrypt(error[1], { ttlSeconds: 60 * 60 }));
      }
    }
  },
  async verifyOtp(ctx) {
    const { email, otp } = ctx.request.body;
    if (!email || !otp) return ctx.badRequest("email & otp required");
    try {
      const emailDecrypted = strapi.plugin("secure-doc").services.cryptoService.decrypt(email);
      await strapi.plugin("secure-doc").services.otp.verifyOtp(otp, emailDecrypted.data);
    } catch (e) {
      return ctx.badRequest("otp");
    }
    return ctx.send({ message: "OTP verified" });
  }
});
const controllers = {
  controller
};
const middlewares = {};
const policies = {};
const contentAPIRoutes = [
  {
    method: "GET",
    path: "/check/:email/:docId",
    handler: "controller.check",
    config: {
      auth: false,
      policies: []
    }
  },
  {
    method: "POST",
    path: "/verify-otp",
    handler: "controller.verifyOtp",
    config: {
      auth: false,
      policies: []
    }
  }
];
const routes = {
  "content-api": {
    type: "content-api",
    routes: contentAPIRoutes
  }
};
process.env.JWT_SECRET;
const service = ({ strapi }) => ({
  generateOtp(length = 6) {
    const digits = "0123456789";
    return Array.from({ length }, () => digits[Math.floor(Math.random() * 10)]).join("");
  },
  async verifyOtp(otp, email) {
    const isOtpValid = await strapi.redis.connections.default.client.get(otp);
    if (!isOtpValid || isOtpValid !== email) {
      const err = new Error("OTP invalid");
      throw err;
    }
    await strapi.redis.connections.default.client.del(otp);
    return true;
  }
});
const ALGO = "aes-256-gcm";
const KEY_ENV = process.env.OBFUSCATION_KEY;
if (!KEY_ENV) {
  console.warn("Warning: OBFUSCATION_KEY not set. Set a strong 32-byte key in env.");
}
const cryptoService = ({ strapi }) => ({
  base64urlEncode(buf) {
    return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  },
  base64urlDecode(str) {
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4) str += "=";
    return Buffer.from(str, "base64");
  },
  getKey() {
    if (!KEY_ENV) throw new Error("OBFUSCATION_KEY not configured");
    if (/^[0-9a-fA-F]{64}$/.test(KEY_ENV)) return Buffer.from(KEY_ENV, "hex");
    return Buffer.from(KEY_ENV, "base64");
  },
  encrypt(data, opts = {}) {
    const key = this.getKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGO, key, iv, { authTagLength: 16 });
    const payload = {
      data,
      iat: Math.floor(Date.now() / 1e3),
      exp: Math.floor(Date.now() / 1e3) + (opts.ttlSeconds || 60 * 60),
      // default 1h
      meta: opts.meta || null
    };
    const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [
      this.base64urlEncode(iv),
      this.base64urlEncode(ciphertext),
      this.base64urlEncode(tag)
    ].join(".");
  },
  decrypt(tokenStr) {
    const key = this.getKey();
    const parts = String(tokenStr || "").split(".");
    if (parts.length !== 3) throw new Error("Malformed token");
    const iv = this.base64urlDecode(parts[0]);
    const ciphertext = this.base64urlDecode(parts[1]);
    const tag = this.base64urlDecode(parts[2]);
    const decipher = crypto.createDecipheriv(ALGO, key, iv, { authTagLength: 16 });
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const payload = JSON.parse(plaintext.toString("utf8"));
    const now = Math.floor(Date.now() / 1e3);
    if (payload.exp && payload.exp < now) {
      const err = new Error(`Token expired|${payload.data}`);
      throw err;
    }
    return payload;
  }
});
const services = {
  otp: service,
  cryptoService
};
const index = {
  register,
  bootstrap,
  destroy,
  config,
  controllers,
  routes,
  services,
  contentTypes,
  policies,
  middlewares
};
export {
  index as default
};
//# sourceMappingURL=index.mjs.map
