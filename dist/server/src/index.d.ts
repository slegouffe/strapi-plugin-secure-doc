/// <reference types="node" />
/// <reference types="node" />
declare const _default: {
    register: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => void;
    bootstrap: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => void;
    destroy: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => void;
    config: {
        default: {};
        validator(): void;
    };
    controllers: {
        controller: ({ strapi }: {
            strapi: import("@strapi/types/dist/core").Strapi;
        }) => {
            check(ctx: any): Promise<any>;
            verifyOtp(ctx: any): Promise<any>;
        };
    };
    routes: {
        'content-api': {
            type: string;
            routes: {
                method: string;
                path: string;
                handler: string;
                config: {
                    auth: boolean;
                    policies: any[];
                };
            }[];
        };
    };
    services: {
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
    contentTypes: {};
    policies: {};
    middlewares: {};
};
export default _default;
