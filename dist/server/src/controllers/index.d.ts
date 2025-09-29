declare const _default: {
    controller: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => {
        check(ctx: any): Promise<any>;
        checkEmail(ctx: any): Promise<any>;
        verifyOtp(ctx: any): Promise<any>;
    };
};
export default _default;
