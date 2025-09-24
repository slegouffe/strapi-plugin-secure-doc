declare const routes: {
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
export default routes;
