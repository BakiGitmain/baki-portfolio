import {
  Router,
} from "express";

import bcrypt from "bcryptjs";

import {
  db,
} from "../config/db.js";

import {
  requireAdmin,
} from "../middleware/auth.middleware.js";

import {
  sendApplicationAcceptedEmail,
} from "../services/application-email.service.js";

import {
  recordPartnerActivity,
} from "../services/partner-activity.service.js";

/* =========================================================
   ROUTER
   ========================================================= */

const router =
  Router();

router.use(
  requireAdmin,
);

/* =========================================================
   DEFAULT FIRST LOGIN PASSWORD
   ========================================================= */

const DEFAULT_TEMPORARY_PASSWORD =
  "1234";

/* =========================================================
   HELPERS
   ========================================================= */

function normalizeEmail(
  value:
    string,
) {
  return value
    .trim()
    .toLowerCase();
}

function normalizePhone(
  value:
    string,
) {
  return value
    .trim()
    .replace(
      /[\s()-]/g,
      "",
    );
}

function formatApplicationCode(
  applicationNumber:
    number |
    string,
) {
  return `APP-${String(
    applicationNumber,
  ).padStart(
    4,
    "0",
  )}`;
}

/* =========================================================
   ACCEPT + CREATE REPRESENTATIVE
   ========================================================= */

router.post(
  "/:id/accept-representative",

  async (
    req,
    res,
    next,
  ) => {
    const applicationId =
      String(
        req.params.id,
      );

    const adminId =
      req.auth?.id;

    if (
      !adminId
    ) {
      res
        .status(
          401,
        )
        .json({
          success:
            false,

          message: {
            en:
              "Administrator authentication required.",

            am:
              "የAdmin authentication ያስፈልጋል።",
          },
        });

      return;
    }

    const client =
      await db.connect();

    let transactionOpen =
      false;

    try {
      /* ===================================================
         BEGIN
         =================================================== */

      await client.query(
        "BEGIN",
      );

      transactionOpen =
        true;

      /* ===================================================
         APPLICATION
         =================================================== */

      const applicationResult =
        await client.query(
          `
            SELECT
              id,
              application_number,

              full_name,
              father_name,

              email,
              phone,

              city,
              address,

              telegram,
              whatsapp,

              status
            FROM sales_representative_applications
            WHERE id = $1
            FOR UPDATE
          `,
          [
            applicationId,
          ],
        );

      const application =
        applicationResult
          .rows[0];

      if (
        !application
      ) {
        await client.query(
          "ROLLBACK",
        );

        transactionOpen =
          false;

        res
          .status(
            404,
          )
          .json({
            success:
              false,

            message: {
              en:
                "Application not found.",

              am:
                "Application አልተገኘም።",
            },
          });

        return;
      }

      /* ===================================================
         REJECTED / ARCHIVED
         =================================================== */

      if (
        application.status ===
          "rejected" ||
        application.status ===
          "archived"
      ) {
        await client.query(
          "ROLLBACK",
        );

        transactionOpen =
          false;

        res
          .status(
            409,
          )
          .json({
            success:
              false,

            message: {
              en:
                "A rejected or archived application cannot be accepted until its status is changed.",

              am:
                "Rejected ወይም archived application በቀጥታ accept ማድረግ አይቻልም።",
            },
          });

        return;
      }

      /* ===================================================
         EXISTING REPRESENTATIVE
         =================================================== */

      const existingResult =
        await client.query(
          `
            SELECT
              id,
              username
            FROM sales_representatives
            WHERE application_id = $1
            LIMIT 1
          `,
          [
            application.id,
          ],
        );

      const existing =
        existingResult
          .rows[0];

      if (
        existing
      ) {
        await client.query(
          "ROLLBACK",
        );

        transactionOpen =
          false;

        res
          .status(
            409,
          )
          .json({
            success:
              false,

            code:
              "REPRESENTATIVE_ALREADY_EXISTS",

            representative: {
              id:
                existing.id,

              username:
                existing.username,
            },

            message: {
              en:
                "A Partner account already exists for this application.",

              am:
                "ለዚህ application Partner account አስቀድሞ ተፈጥሯል።",
            },
          });

        return;
      }

      /* ===================================================
         REPRESENTATIVE NUMBER
         =================================================== */

      const numberResult =
        await client.query(
          `
            SELECT
              nextval(
                'sales_representative_number_seq'
              ) AS representative_number
          `,
        );

      const representativeNumber =
        Number(
          numberResult
            .rows[0]
            .representative_number,
        );

      const username =
        `PS-${String(
          representativeNumber,
        ).padStart(
          4,
          "0",
        )}`;

      /* ===================================================
         PASSWORD 1234
         =================================================== */

      const passwordHash =
        await bcrypt.hash(
          DEFAULT_TEMPORARY_PASSWORD,
          12,
        );

      /* ===================================================
         CREATE REPRESENTATIVE
         =================================================== */

      const representativeResult =
        await client.query(
          `
            INSERT INTO sales_representatives (
              application_id,
              representative_number,
              username,

              name,
              father_name,

              email,
              email_normalized,

              phone,
              phone_normalized,

              city,
              address,

              telegram,
              whatsapp,

              password_hash,

              must_change_password,
              accepted_by_admin_id
            )
            VALUES (
              $1,
              $2,
              $3,

              $4,
              $5,

              $6,
              $7,

              $8,
              $9,

              $10,
              $11,

              $12,
              $13,

              $14,

              TRUE,
              $15
            )
            RETURNING
              id,
              username,
              name,
              email,
              created_at
          `,
          [
            application.id,

            representativeNumber,

            username,

            application
              .full_name,

            application
              .father_name,

            application.email,

            normalizeEmail(
              application.email,
            ),

            application.phone,

            normalizePhone(
              application.phone,
            ),

            application.city,

            application.address,

            application.telegram ||
              null,

            application.whatsapp ||
              null,

            passwordHash,

            adminId,
          ],
        );

      const representative =
        representativeResult
          .rows[0];

      /* ===================================================
         ACCEPT APPLICATION
         =================================================== */

      await client.query(
        `
          UPDATE sales_representative_applications
          SET
            status = 'accepted',

            reviewed_at =
              NOW(),

            reviewed_by_admin_id =
              $1,

            updated_at =
              NOW()
          WHERE id = $2
        `,
        [
          adminId,
          application.id,
        ],
      );

      await client.query(
        `
          UPDATE partner_referrals
          SET
            status = 'accepted',
            referred_representative_id = $1::uuid,
            accepted_at = NOW(),
            reviewed_by_admin_id = $2::uuid,
            updated_at = NOW()
          WHERE
            application_id = $3::uuid
            AND status = 'attributed'
        `,
        [
          representative.id,
          adminId,
          application.id,
        ],
      );

      /* ===================================================
         COMMIT BEFORE EMAIL
         =================================================== */

      await client.query(
        "COMMIT",
      );

      transactionOpen =
        false;

      await recordPartnerActivity({
        eventType:
          "representative_accepted",

        actorType:
          "admin",

        representativeId:
          representative.id,

        adminUserId:
          adminId,

        applicationId:
          application.id,

        metadata: {
          label:
            representative.username,
        },
      });

      /* ===================================================
         SEND ACCEPTANCE EMAIL

         Email failure does NOT remove the account.
         =================================================== */

      const applicationCode =
        formatApplicationCode(
          application
            .application_number,
        );

      const emailSent =
        await sendApplicationAcceptedEmail({
          applicationId:
            application.id,

          applicationCode,

          email:
            application.email,

          fullName:
            application
              .full_name,

          username:
            representative
              .username,

          temporaryPassword:
            DEFAULT_TEMPORARY_PASSWORD,
        });

      /* ===================================================
         RESPONSE
         =================================================== */

      res
        .status(
          201,
        )
        .json({
          success:
            true,

          emailSent,

          representative: {
            id:
              representative.id,

            username:
              representative.username,

            name:
              representative.name,

            email:
              representative.email,
          },

          credentials: {
            username:
              representative.username,

            temporaryPassword:
              DEFAULT_TEMPORARY_PASSWORD,

            mustChangePassword:
              true,
          },

          message:
            emailSent
              ? {
                  en:
                    "Partner account created successfully. The applicant received the login information by email.",

                  am:
                    "Partner account በተሳካ ሁኔታ ተፈጥሯል። Login information በemail ተልኳል።",
                }
              : {
                  en:
                    "Partner account created successfully, but the acceptance email could not be sent.",

                  am:
                    "Partner account በተሳካ ሁኔታ ተፈጥሯል፣ ነገር ግን acceptance email መላክ አልተቻለም።",
                },
        });
    } catch (
      error
    ) {
      if (
        transactionOpen
      ) {
        try {
          await client.query(
            "ROLLBACK",
          );
        } catch {
          //
        }
      }

      const databaseError =
        error as {
          code?:
            string;
        };

      if (
        databaseError.code ===
        "23505"
      ) {
        res
          .status(
            409,
          )
          .json({
            success:
              false,

            message: {
              en:
                "A Partner account with this email, phone number or username already exists.",

              am:
                "በዚህ email፣ phone number ወይም username Partner account አስቀድሞ አለ።",
            },
          });

        return;
      }

      next(
        error,
      );
    } finally {
      client.release();
    }
  },
);

export default router;
