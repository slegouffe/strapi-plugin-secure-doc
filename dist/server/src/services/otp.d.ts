import type { Core } from '@strapi/strapi';
declare const service: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    generateOtp(length?: number): string;
    verifyOtp(otp: any, email: any): Promise<boolean>;
};
export default service;
