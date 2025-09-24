import type { Redis } from "ioredis";

declare module "@strapi/strapi" {
  export namespace Core {
    // On étend l'interface déjà existante au lieu de la remplacer
    interface Strapi {
      redis: {
        connections: {
          default: {
            client: Redis;
          };
        };
      };
      plugin(name: string): any;
      service(name: string): any;
    }
  }
}