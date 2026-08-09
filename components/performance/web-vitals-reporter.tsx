"use client";

import {
  useCallback,
} from "react";

import {
  useReportWebVitals,
} from "next/web-vitals";

/* =========================================================
   TYPES
   ========================================================= */

type ReportWebVitalsCallback =
  Parameters<
    typeof useReportWebVitals
  >[0];

type WebVitalsMetric =
  Parameters<
    ReportWebVitalsCallback
  >[0];

/* =========================================================
   CONFIG
   ========================================================= */

const CORE_WEB_VITALS =
  new Set([
    "LCP",
    "INP",
    "CLS",
  ]);

function getApiBase() {
  const value =
    (
      process.env
        .NEXT_PUBLIC_PERFORMANCE_API_URL ??
      process.env
        .NEXT_PUBLIC_API_URL ??
      ""
    ).trim();

  return value.replace(
    /\/$/,
    "",
  );
}

/* =========================================================
   REPORTER
   ========================================================= */

export default function WebVitalsReporter() {
  const report =
    useCallback(
      (
        metric:
          WebVitalsMetric,
      ) => {
        /*
          IMPORTANT:

          Do not store localhost development measurements
          as real production performance data.
        */

const allowLocalTesting =
  process.env
    .NEXT_PUBLIC_ENABLE_LOCAL_PERFORMANCE ===
  "true";

if (
  process.env.NODE_ENV !==
    "production" &&
  !allowLocalTesting
) {
  return;
}

        if (
          !CORE_WEB_VITALS.has(
            metric.name,
          )
        ) {
          return;
        }

        if (
          typeof window ===
          "undefined"
        ) {
          return;
        }

        const siteSlug =
          process.env
            .NEXT_PUBLIC_PERFORMANCE_SITE_SLUG
            ?.trim();

        const apiBase =
          getApiBase();

        if (
          !siteSlug ||
          !apiBase
        ) {
          return;
        }

        const endpoint =
          `${apiBase}/api/performance/vitals`;

        const payload = {
          siteSlug,

          name:
            metric.name,

          value:
            metric.value,

          id:
            metric.id,

          pathname:
            window.location.pathname ||
            "/",

          origin:
            window.location.origin,
        };

        /*
          keepalive allows the request to finish even when
          the user is leaving/navigating away from the page.
        */

        void fetch(
          endpoint,
          {
            method:
              "POST",

            credentials:
              "omit",

            keepalive:
              true,

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body:
              JSON.stringify(
                payload,
              ),
          },
        ).catch(
          () => {
            /*
              Performance telemetry should never break the
              website for the visitor.
            */
          },
        );
      },
      [],
    );

  useReportWebVitals(
    report,
  );

  return null;
}