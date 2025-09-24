/// <reference types="node" />
/// <reference types="node" />
declare const _default: {
    otp: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => {
        generateOtp(length?: number): string;
        verifyOtp(otp: any, email: any): Promise<boolean>;
    };
    cryptoService: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => {
        base64urlEncode(buf: any): any;
        base64urlDecode(str: any): Buffer;
        getKey(): Buffer;
        encrypt(data: any, opts?: {
            ttlSeconds?: number;
            meta?: any;
        }): string;
        decrypt(tokenStr: any): any;
    };
};
export default _default;
