import express, {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express";

import cors from "cors";
import aiRouter from "./routes/ai.routes.js";
import helmetModule from "helmet";

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

import adminSitesRouter from "./routes/admin-sites.routes.js";

import adminSiteAnalyticsRouter from "./routes/admin-site-analytics.routes.js";

import adminSitePerformanceRouter from "./routes/admin-site-performance.routes.js";

import adminSiteHealthRouter from "./routes/admin-site-health.routes.js";

import performanceRouter from "./routes/performance.routes.js";

import siteHealthRunnerRouter from "./routes/site-health-runner.routes.js";

import healthRouter from "./routes/health.routes.js";

import projectsRouter from "./routes/projects.routes.js";

/* =========================================================
   APP
   ========================================================= */

const app =
  express();

/* =========================================================
   HELMET TYPESCRIPT WORKAROUND

   DO NOT REMOVE.
   ========================================================= */

const helmet =
  helmetModule as unknown as (
    options?: Record<
      string,
      unknown
    >,
  ) => RequestHandler;

/* =========================================================
   PROXY
   ========================================================= */

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
   INTERNAL HEALTH RUNNER

   Server-to-server endpoint.

   It does NOT need browser CORS.

   Authentication is handled by
   X-Health-Monitor-Secret.
   ========================================================= */

app.use(
  "/api/internal/health-checks",
  siteHealthRunnerRouter,
);

/* =========================================================
   PUBLIC PERFORMANCE COLLECTOR
   ========================================================= */

app.use(
  "/api/performance",

  cors({
    origin:
      true,

    credentials:
      false,

    methods: [
      "POST",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Accept",
    ],

    maxAge:
      86400,
  }),

  express.json({
    limit:
      "32kb",
  }),

  performanceRouter,
);

/* =========================================================
   NORMAL FRONTEND CORS
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
      success:
        true,

      message:
        "Baki Portfolio API",
    });
  },
);

/* =========================================================
   PUBLIC
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
   BAKI AI
   ========================================================= */

app.use(
  "/api/ai",
  aiRouter,
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
   ADMIN PROJECTS
   ========================================================= */

app.use(
  "/api/admin/projects",
  adminProjectsRouter,
);

/* =========================================================
   ADMIN ANALYTICS
   ========================================================= */

app.use(
  "/api/admin/sites",
  adminSiteAnalyticsRouter,
);

/* =========================================================
   ADMIN PERFORMANCE
   ========================================================= */

app.use(
  "/api/admin/sites",
  adminSitePerformanceRouter,
);

/* =========================================================
   ADMIN HEALTH
   ========================================================= */

app.use(
  "/api/admin/sites",
  adminSiteHealthRouter,
);

/* =========================================================
   ADMIN SITES
   ========================================================= */

app.use(
  "/api/admin/sites",
  adminSitesRouter,
);

/* =========================================================
   ADMIN
   ========================================================= */

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
    res
      .status(404)
      .json({
        success:
          false,

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
    error:
      unknown,

    _req:
      Request,

    res:
      Response,

    _next:
      NextFunction,
  ) => {
    console.error(
      error,
    );

    res
      .status(500)
      .json({
        success:
          false,

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