import {
  isIP,
} from "node:net";

import type {
  Request,
} from "express";

import {
  ipKeyGenerator,
  rateLimit as expressRateLimit,
  type Options,
} from "express-rate-limit";

/* =========================================================
   DEPLOYMENT / PROXY TOPOLOGY

   Local development reaches Express directly, so forwarded
   headers must not be trusted there.

   The production API is deployed as a Vercel Function. Vercel
   terminates the public connection and overwrites its platform
   forwarding headers before invoking the function.
   ========================================================= */

export const IS_VERCEL_RUNTIME =
  process.env.VERCEL ===
  "1";

export const EXPRESS_TRUST_PROXY =
  IS_VERCEL_RUNTIME
    ? 1
    : false;

function normalizeIp(
  value:
    string |
    null |
    undefined,
) {
  if (
    !value
  ) {
    return null;
  }

  const candidate =
    value
      .split(
        ",",
        1,
      )[0]
      ?.trim();

  if (
    !candidate
  ) {
    return null;
  }

  if (
    isIP(
      candidate,
    ) ===
    0
  ) {
    return null;
  }

  return candidate;
}

export function getRequestIp(
  request:
    Request,
) {
  const expressIp =
    normalizeIp(
      request.ip,
    );

  if (
    expressIp
  ) {
    return expressIp;
  }

  const socketIp =
    normalizeIp(
      request.socket
        ?.remoteAddress,
    );

  if (
    socketIp
  ) {
    return socketIp;
  }

  if (
    !IS_VERCEL_RUNTIME
  ) {
    return null;
  }

  /*
   * Use only Vercel-owned forwarding information here. This
   * branch cannot be enabled by a request header; VERCEL is a
   * deployment environment variable supplied by the platform.
   * x-vercel-forwarded-for is preferred because it remains the
   * Vercel-authenticated client address when another proxy sits
   * in front of the deployment.
   */
  return (
    normalizeIp(
      request.get(
        "x-vercel-forwarded-for",
      ),
    ) ??
    normalizeIp(
      request.get(
        "x-forwarded-for",
      ),
    )
  );
}

export function rateLimitKeyGenerator(
  request:
    Request,
) {
  /*
   * req.auth is populated only after the server verifies the
   * signed session and reloads the account from the database.
   * No representative/admin ID supplied by the browser is used.
   */
  if (
    request.auth
      ?.id &&
    (
      request.auth.role ===
        "representative" ||
      request.auth.role ===
        "admin"
    )
  ) {
    return `${request.auth.role}:${request.auth.id}`;
  }

  const ip =
    getRequestIp(
      request,
    );

  if (
    ip
  ) {
    return `ip:${ipKeyGenerator(
      ip,
    )}`;
  }

  /*
   * Fail closed into one shared anonymous bucket if a runtime
   * supplies neither a valid socket address nor a trusted
   * platform address. This keeps protection active and avoids
   * inventing a spoofable identity.
   */
  return "ip:unavailable";
}

export function rateLimit(
  options:
    Partial<Options>,
) {
  return expressRateLimit({
    ...options,

    keyGenerator:
      options.keyGenerator ??
      rateLimitKeyGenerator,
  });
}
