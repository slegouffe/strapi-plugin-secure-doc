import type { Core } from '@strapi/strapi';
declare const cryptoService: ({ strapi }: {
    strapi: Core.Strapi;
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
export default cryptoService;
