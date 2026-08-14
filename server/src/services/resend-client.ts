import {
  Resend,
} from "resend";

/* =========================================================
   SHARED RESEND CONFIGURATION

   Keep all email delivery on the existing Resend account.
   These values are server-only and are never sent to the
   browser.
   ========================================================= */

const RESEND_API_KEY =
  process.env
    .RESEND_API_KEY
    ?.trim();

export const RESEND_FROM_EMAIL =
  process.env
    .RESEND_FROM_EMAIL
    ?.trim() ||
  "Baki Digital <noreply@bakidigital.com>";

export const resendClient =
  RESEND_API_KEY
    ? new Resend(
        RESEND_API_KEY,
      )
    : null;
