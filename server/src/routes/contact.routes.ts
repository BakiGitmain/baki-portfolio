import {
  randomUUID,
} from "node:crypto";

import {
  Router,
} from "express";

import {
  z,
} from "zod";

import {
  rateLimit,
} from "../middleware/rate-limit.middleware.js";

import {
  deliverContactInquiry,
  type ContactDeliveryResult,
  type ContactInquiryEmail,
} from "../services/contact-email.service.js";

/* =========================================================
   STABLE MACHINE VALUES
   ========================================================= */

export const CONTACT_PROJECT_TYPES = [
  "full-stack-website",
  "landing-page",
  "web-application",
  "admin-dashboard",
  "ui-ux-redesign",
  "other",
] as const;

export const CONTACT_BUDGETS = [
  "etb-35000-50000",
  "etb-50000-80000",
  "etb-80000-100000-plus",
  "discuss",
] as const;

type ContactProjectType =
  (typeof CONTACT_PROJECT_TYPES)[number];

type ContactBudget =
  (typeof CONTACT_BUDGETS)[number];

const PROJECT_TYPE_LABELS:
  Record<
    ContactProjectType,
    string
  > = {
    "full-stack-website":
      "Full-stack Website",

    "landing-page":
      "Landing Page",

    "web-application":
      "Web Application",

    "admin-dashboard":
      "Admin Dashboard",

    "ui-ux-redesign":
      "UI/UX Redesign",

    other:
      "Other",
  };

const BUDGET_LABELS:
  Record<
    ContactBudget,
    string
  > = {
    "etb-35000-50000":
      "ETB 35,000 – 50,000",

    "etb-50000-80000":
      "ETB 50,000 – 80,000",

    "etb-80000-100000-plus":
      "ETB 80,000 – 100,000+",

    discuss:
      "Let's Discuss",
  };

const PHONE_CHARACTERS =
  /^\+?[0-9](?:[0-9 ().-]*[0-9])?$/;

function isReasonablePhoneNumber(
  value:
    string,
) {
  const digitCount =
    value.replace(
      /\D/g,
      "",
    ).length;

  return (
    digitCount >=
      7 &&
    digitCount <=
      15 &&
    PHONE_CHARACTERS.test(
      value,
    )
  );
}

/* =========================================================
   VALIDATION
   ========================================================= */

export const contactInquirySchema =
  z
    .object({
      name: z
        .string()
        .trim()
        .min(2)
        .max(100),

      email: z
        .string()
        .trim()
        .max(254)
        .email()
        .transform(
          (
            value,
          ) =>
            value.toLowerCase(),
        ),

      mobileNumber: z
        .string()
        .trim()
        .min(1)
        .max(30)
        .refine(
          isReasonablePhoneNumber,
        ),

      projectType:
        z.enum(
          CONTACT_PROJECT_TYPES,
        ),

      budget:
        z.enum(
          CONTACT_BUDGETS,
        ),

      message: z
        .string()
        .trim()
        .min(20)
        .max(3000),

      companyWebsite: z
        .string()
        .trim()
        .max(2048)
        .optional()
        .default(""),
    })
    .strict();

export function isHoneypotSubmission(
  body:
    unknown,
) {
  if (
    !body ||
    typeof body !==
      "object"
  ) {
    return false;
  }

  const value =
    (
      body as
        Record<
          string,
          unknown
        >
    ).companyWebsite;

  if (
    value ===
      undefined ||
    value ===
      null
  ) {
    return false;
  }

  if (
    typeof value ===
    "string"
  ) {
    return value
      .trim()
      .length >
      0;
  }

  return true;
}

/* =========================================================
   RESPONSES
   ========================================================= */

const SUCCESS_RESPONSE = {
  success:
    true,

  message: {
    en:
      "Message sent! I'll get back to you as soon as possible.",

    am:
      "መልዕክትዎ ተልኳል! በተቻለ ፍጥነት እመልስልዎታለሁ።",
  },
} as const;

function createContactLimiter() {
  return rateLimit({
    windowMs:
      60 *
      60 *
      1000,

    limit:
      5,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      success:
        false,

      code:
        "CONTACT_RATE_LIMITED",

      message: {
        en:
          "Too many messages were sent recently. Please try again in about an hour.",

        am:
          "በአጭር ጊዜ ውስጥ ብዙ መልዕክቶች ተልከዋል። እባክዎ ከአንድ ሰዓት ገደማ በኋላ ይሞክሩ።",
      },
    },
  });
}

export type ContactDeliveryHandler = (
  input:
    ContactInquiryEmail,
) => Promise<ContactDeliveryResult>;

/* =========================================================
   ROUTER FACTORY

   The delivery dependency keeps failure behavior testable
   without sending real email.
   ========================================================= */

export function createContactRouter({
  deliver =
    deliverContactInquiry,
}: {
  deliver?:
    ContactDeliveryHandler;
} = {}) {
  const router =
    Router();

  router.post(
    "/",

    createContactLimiter(),

    async (
      req,
      res,
      next,
    ) => {
      /* ===================================================
         HONEYPOT

         Return the same success body as a real submission so
         simple bots do not learn how detection works.
         =================================================== */

      if (
        isHoneypotSubmission(
          req.body,
        )
      ) {
        res.json(
          SUCCESS_RESPONSE,
        );

        return;
      }

      const parsed =
        contactInquirySchema
          .safeParse(
            req.body,
          );

      if (
        !parsed.success
      ) {
        res
          .status(
            400,
          )
          .json({
            success:
              false,

            code:
              "INVALID_CONTACT_INQUIRY",

            message: {
              en:
                "Please check the contact form and try again.",

              am:
                "እባክዎ የመገናኛ ቅጹን መረጃ ያረጋግጡና እንደገና ይሞክሩ።",
            },
          });

        return;
      }

      const input =
        parsed.data;

      try {
        const delivery =
          await deliver({
            inquiryId:
              randomUUID(),

            name:
              input.name,

            email:
              input.email,

            mobileNumber:
              input.mobileNumber,

            projectType:
              PROJECT_TYPE_LABELS[
                input.projectType
              ],

            budget:
              BUDGET_LABELS[
                input.budget
              ],

            message:
              input.message,
          });

        if (
          !delivery
            .ownerSent
        ) {
          res
            .status(
              503,
            )
            .json({
              success:
                false,

              code:
                "CONTACT_DELIVERY_UNAVAILABLE",

              message: {
                en:
                  "Your message could not be delivered right now. Please wait a moment and try again.",

                am:
                  "መልዕክትዎን አሁን መላክ አልተቻለም። እባክዎ ትንሽ ቆይተው እንደገና ይሞክሩ።",
              },
            });

          return;
        }

        /*
         * The owner email is the delivery source of truth.
         * Confirmation failure is logged by the email service
         * and never turns this response into a false failure.
         */
        res.json(
          SUCCESS_RESPONSE,
        );
      } catch (
        error
      ) {
        next(
          error,
        );
      }
    },
  );

  return router;
}

export default createContactRouter();
