import type { Core } from '@strapi/strapi';
declare const controller: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    check(ctx: any): Promise<any>;
    checkEmail(ctx: any): Promise<any>;
    verifyOtp(ctx: any): Promise<any>;
};
export default controller;
