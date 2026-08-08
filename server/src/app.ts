import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";

import cors from "cors";

import helmet from "helmet";

import cookieParser from "cookie-parser";

import {
  rateLimit,
} from "express-rate-limit";

import {
  env,
} from "./config/env.js";

import authRouter from "./routes/auth.routes.js";

import adminRouter from "./routes/admin.routes.js";

import adminProjectsRouter from "./routes/admin-projects.routes.js";

import healthRouter from "./routes/health.routes.js";

import projectsRouter from "./routes/projects.routes.js";

const app =
  express();

app.set(
  "trust proxy",
  1,
);

/* =========================================================
   SECURITY
   ========================================================= */

app.use(
  helmet(),
);

/* =========================================================
   CORS
   ========================================================= */

app.use(
  cors({
    origin:
      env.FRONTEND_URL,

    credentials:
      true,
  }),
);

/* =========================================================
   BODY
   ========================================================= */

app.use(
  express.json({
    limit:
      "1mb",
  }),
);

/* =========================================================
   COOKIES
   ========================================================= */

app.use(
  cookieParser(),
);

/* =========================================================
   AUTH RATE LIMIT
   ========================================================= */

const authLimiter =
  rateLimit({
    windowMs:
      15 *
      60 *
      1000,

    limit:
      20,

    standardHeaders:
      true,

    legacyHeaders:
      false,
  });

/* =========================================================
   ROOT
   ========================================================= */

app.get(
  "/",
  (
    _req,
    res,
  ) => {
    res.json({
      success: true,

      message:
        "Baki Portfolio API",
    });
  },
);

/* =========================================================
   PUBLIC ROUTES
   ========================================================= */

app.use(
  "/api/health",
  healthRouter,
);

app.use(
  "/api/projects",
  projectsRouter,
);

/* =========================================================
   AUTH
   ========================================================= */

app.use(
  "/api/auth",
  authLimiter,
  authRouter,
);

/* =========================================================
   ADMIN
   ========================================================= */

app.use(
  "/api/admin/projects",
  adminProjectsRouter,
);

app.use(
  "/api/admin",
  adminRouter,
);

/* =========================================================
   404
   ========================================================= */

app.use(
  (
    _req,
    res,
  ) => {
    res.status(
      404,
    ).json({
      success: false,

      message: {
        en:
          "Route not found.",

        am:
          "የተጠየቀው route አልተገኘም።",
      },
    });
  },
);

/* =========================================================
   ERROR HANDLER
   ========================================================= */

app.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    console.error(
      error,
    );

    res.status(
      500,
    ).json({
      success: false,

      message: {
        en:
          "Internal server error.",

        am:
          "የServer ችግር ተፈጥሯል።",
      },
    });
  },
);

export default app;