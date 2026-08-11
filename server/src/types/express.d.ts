import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    auth?: {
      id: string;

      username: string;

      name: string;

      email: string;

      role:
        | "admin"
        | "representative";

      mustChangePassword?:
        boolean;

      sessionVersion?:
        number;
    };
  }
}

export {};