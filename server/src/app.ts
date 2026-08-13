import express, {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express";

import cors from "cors";
import accountAuthRouter from "./routes/account-auth.routes.js";
import helmetModule from "helmet";
import adminTrainingRouter from "./routes/admin-training.routes.js";
import cookieParser from "cookie-parser";
import representativeAuthRouter from "./routes/representative-auth.routes.js";
import representativeTrainingRouter from "./routes/representative-training.routes.js";
import representativeChatRouter from "./routes/representative-chat.routes.js";
import representativeProfileRouter from "./routes/representative-profile.routes.js";
import representativeEmailChangeRouter from "./routes/representative-email-change.routes.js";
import representativeProgramsRouter from "./routes/representative-programs.routes.js";
import representativeRouter from "./routes/representative.routes.js";

import representativeReportReminderRouter from "./routes/representative-report-reminder.routes.js";
import partnerChatRetentionRouter from "./routes/partner-chat-retention.routes.js";

import representativeOnboardingRouter from "./routes/representative-onboarding.routes.js";
/* =========================================================
   CONFIG
   ========================================================= */

import {
  env,
} from "./config/env.js";

/* =========================================================
   ROUTES
   ========================================================= */

import aiRouter from "./routes/ai.routes.js";

import authRouter from "./routes/auth.routes.js";

import adminRouter from "./routes/admin.routes.js";

import adminReportsRouter from "./routes/admin-reports.routes.js";
import adminChatRouter from "./routes/admin-chat.routes.js";
import adminDashboardRouter from "./routes/admin-dashboard.routes.js";
import adminProgramsRouter from "./routes/admin-programs.routes.js";
import adminPartnerModerationRouter from "./routes/admin-partner-moderation.routes.js";
import adminChatReportsRouter from "./routes/admin-chat-reports.routes.js";

import applicationsRouter from "./routes/applications.routes.js";

import adminApplicationsRouter from "./routes/admin-applications.routes.js";

import adminProjectsRouter from "./routes/admin-projects.routes.js";

import adminSitesRouter from "./routes/admin-sites.routes.js";

import adminSiteAnalyticsRouter from "./routes/admin-site-analytics.routes.js";

import adminSitePerformanceRouter from "./routes/admin-site-performance.routes.js";

import adminSiteHealthRouter from "./routes/admin-site-health.routes.js";

import performanceRouter from "./routes/performance.routes.js";

import siteHealthRunnerRouter from "./routes/site-health-runner.routes.js";

import healthRouter from "./routes/health.routes.js";

import projectsRouter from "./routes/projects.routes.js";

import {
  EXPRESS_TRUST_PROXY,
} from "./middleware/rate-limit.middleware.js";

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
  EXPRESS_TRUST_PROXY,
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

app.use(
  "/api/internal/representative-report-reminders",

  representativeReportReminderRouter,
);

app.use(
  "/api/internal/partner-chat-retention",
  partnerChatRetentionRouter,
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
   SALES REPRESENTATIVE APPLICATIONS

   PUBLIC submission endpoints.

   The admin review API is mounted separately below.
   ========================================================= */

app.use(
  "/api/applications",

  applicationsRouter,
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

  authRouter,
);
/* =========================================================
   REPRESENTATIVE AUTH
   ========================================================= */

app.use(
  "/api/representative-auth",
  representativeAuthRouter,
);

/* =========================================================
   REPRESENTATIVE TRAINING
   ========================================================= */

app.use(
  "/api/representative/training",
  representativeTrainingRouter,
);

app.use(
  "/api/representative/chat",
  representativeChatRouter,
);

app.use(
  "/api/representative/profile/email-change",
  representativeEmailChangeRouter,
);

app.use(
  "/api/representative/profile",
  representativeProfileRouter,
);

app.use(
  "/api/representative/programs",
  representativeProgramsRouter,
);

/* =========================================================
   REPRESENTATIVE PORTAL
   ========================================================= */

app.use(
  "/api/representative",
  representativeRouter,
);

/* =========================================================
   REPRESENTATIVE ONBOARDING

   Keep this BEFORE the normal admin applications router.
   ========================================================= */

app.use(
  "/api/admin/applications",
  representativeOnboardingRouter,
);
/* =========================================================
   ADMIN APPLICATIONS
   ========================================================= */

app.use(
  "/api/admin/applications",

  adminApplicationsRouter,
);

/* =========================================================
   ADMIN PROJECTS
   ========================================================= */

app.use(
  "/api/admin/projects",

  adminProjectsRouter,
);
/* =========================================================
   ADMIN TRAINING
   ========================================================= */

app.use(
  "/api/admin/training",
  adminTrainingRouter,
);

/* =========================================================
   ADMIN REPRESENTATIVE REPORTS
   ========================================================= */

app.use(
  "/api/admin/reports",

  adminReportsRouter,
);

app.use(
  "/api/admin/chat",
  adminChatRouter,
);

app.use(
  "/api/admin/chat-reports",
  adminChatReportsRouter,
);

app.use(
  "/api/admin/partners",
  adminPartnerModerationRouter,
);

app.use(
  "/api/admin/dashboard",
  adminDashboardRouter,
);

app.use(
  "/api/admin/programs",
  adminProgramsRouter,
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
   UNIFIED ACCOUNT LOGIN
   ========================================================= */

app.use(
  "/api/account-auth",
  accountAuthRouter,
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
      .status(
        404,
      )
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
      .status(
        500,
      )
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
