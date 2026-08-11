import {
  Router,
  type Response,
} from "express";

import {
  z,
} from "zod";

import {
  cloudinary,
} from "../config/cloudinary.js";

import {
  db,
} from "../config/db.js";

import {
  requireAdmin,
} from "../middleware/auth.middleware.js";

import {
  sendApplicationRejectedEmail,
  sendApplicationUnderReviewEmail,
} from "../services/application-email.service.js";

/* =========================================================
   ROUTER
   ========================================================= */

const router =
  Router();

/* =========================================================
   TYPES
   ========================================================= */

type ApplicationStatus =
  | "pending"
  | "reviewing"
  | "accepted"
  | "rejected"
  | "archived";

type ApplicationRow = {
  id:
    string;

  application_number:
    string |
    number;

  full_name:
    string;

  father_name:
    string;

  email:
    string;

  phone:
    string;

  city:
    string;

  address:
    string;

  telegram:
    string |
    null;

  whatsapp:
    string |
    null;

  motivation:
    string;

  id_type:
    string;

  id_front_public_id:
    string;

  id_front_format:
    string;

  id_back_public_id:
    string;

  id_back_format:
    string;

  status:
    ApplicationStatus;

  admin_notes:
    string |
    null;

  rules_accepted:
    boolean;

  rules_accepted_at:
    Date;

  reviewed_at:
    Date |
    null;

  reviewed_by_admin_id:
    string |
    null;

  created_at:
    Date;

  updated_at:
    Date;
};

/* =========================================================
   HELPERS
   ========================================================= */

function errorResponse(
  res:
    Response,

  status:
    number,

  code:
    string,

  en:
    string,

  am:
    string,
) {
  res
    .status(
      status,
    )
    .json({
      success:
        false,

      code,

      message: {
        en,
        am,
      },
    });
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

function mapApplication(
  row:
    ApplicationRow,
) {
  return {
    id:
      row.id,

    applicationCode:
      formatApplicationCode(
        row.application_number,
      ),

    fullName:
      row.full_name,

    fatherName:
      row.father_name,

    email:
      row.email,

    phone:
      row.phone,

    city:
      row.city,

    address:
      row.address,

    telegram:
      row.telegram,

    whatsapp:
      row.whatsapp,

    motivation:
      row.motivation,

    idType:
      row.id_type,

    documents: {
      front:
        Boolean(
          row.id_front_public_id,
        ),

      back:
        Boolean(
          row.id_back_public_id,
        ),
    },

    status:
      row.status,

    adminNotes:
      row.admin_notes ??
      "",

    rulesAccepted:
      row.rules_accepted,

    rulesAcceptedAt:
      row.rules_accepted_at,

    reviewedAt:
      row.reviewed_at,

    reviewedByAdminId:
      row.reviewed_by_admin_id,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

/* =========================================================
   VALIDATION
   ========================================================= */

const querySchema =
  z.object({
    search: z
      .string()
      .trim()
      .max(120)
      .optional()
      .default(
        "",
      ),

    status: z
      .enum([
        "all",
        "pending",
        "reviewing",
        "accepted",
        "rejected",
        "archived",
      ])
      .optional()
      .default(
        "all",
      ),

    page: z.coerce
      .number()
      .int()
      .min(1)
      .optional()
      .default(
        1,
      ),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .default(
        20,
      ),
  });

const idSchema =
  z
    .string()
    .uuid();

const updateStatusSchema =
  z.object({
    status: z.enum([
      "pending",
      "reviewing",
      "accepted",
      "rejected",
      "archived",
    ]),

    adminNotes: z
      .string()
      .trim()
      .max(5000)
      .optional(),
  });

const documentSideSchema =
  z.enum([
    "front",
    "back",
  ]);

/* =========================================================
   REQUIRE ADMIN
   ========================================================= */

router.use(
  requireAdmin,
);

/* =========================================================
   LIST APPLICATIONS
   ========================================================= */

router.get(
  "/",

  async (
    req,
    res,
    next,
  ) => {
    try {
      const parsed =
        querySchema.safeParse(
          req.query,
        );

      if (
        !parsed.success
      ) {
        errorResponse(
          res,
          400,
          "INVALID_QUERY",
          "Invalid applications query.",
          "የapplications query ትክክል አይደለም።",
        );

        return;
      }

      const {
        search,
        status,
        page,
        limit,
      } =
        parsed.data;

      const conditions:
        string[] =
        [];

      const values:
        unknown[] =
        [];

      if (
        status !==
        "all"
      ) {
        values.push(
          status,
        );

        conditions.push(
          `status = $${values.length}`,
        );
      }

      if (
        search
      ) {
        values.push(
          `%${search}%`,
        );

        const position =
          values.length;

        conditions.push(
          `
            (
              full_name ILIKE $${position}
              OR father_name ILIKE $${position}
              OR email ILIKE $${position}
              OR phone ILIKE $${position}
              OR city ILIKE $${position}
              OR CAST(application_number AS TEXT)
                ILIKE $${position}
            )
          `,
        );
      }

      const whereClause =
        conditions.length >
        0
          ? `WHERE ${conditions.join(
              " AND ",
            )}`
          : "";

      /* ===================================================
         SUMMARY
         =================================================== */

      const summaryResult =
        await db.query(
          `
            SELECT
              COUNT(*)::int AS total,

              COUNT(*) FILTER (
                WHERE status = 'pending'
              )::int AS pending,

              COUNT(*) FILTER (
                WHERE status = 'reviewing'
              )::int AS reviewing,

              COUNT(*) FILTER (
                WHERE status = 'accepted'
              )::int AS accepted,

              COUNT(*) FILTER (
                WHERE status = 'rejected'
              )::int AS rejected,

              COUNT(*) FILTER (
                WHERE status = 'archived'
              )::int AS archived
            FROM sales_representative_applications
          `,
        );

      /* ===================================================
         FILTERED COUNT
         =================================================== */

      const countResult =
        await db.query(
          `
            SELECT
              COUNT(*)::int AS count
            FROM sales_representative_applications
            ${whereClause}
          `,

          values,
        );

      const totalFiltered =
        Number(
          countResult
            .rows[0]
            ?.count ??
            0,
        );

      const offset =
        (
          page -
          1
        ) *
        limit;

      /* ===================================================
         DATA
         =================================================== */

      const dataValues =
        [
          ...values,

          limit,

          offset,
        ];

      const limitPosition =
        values.length +
        1;

      const offsetPosition =
        values.length +
        2;

      const result =
        await db.query(
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

              motivation,

              id_type,

              id_front_public_id,
              id_front_format,

              id_back_public_id,
              id_back_format,

              status,
              admin_notes,

              rules_accepted,
              rules_accepted_at,

              reviewed_at,
              reviewed_by_admin_id,

              created_at,
              updated_at
            FROM sales_representative_applications
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${limitPosition}
            OFFSET $${offsetPosition}
          `,

          dataValues,
        );

      const summary =
        summaryResult
          .rows[0] ??
        {};

      res.json({
        success:
          true,

        summary: {
          total:
            Number(
              summary.total ??
              0,
            ),

          pending:
            Number(
              summary.pending ??
              0,
            ),

          reviewing:
            Number(
              summary.reviewing ??
              0,
            ),

          accepted:
            Number(
              summary.accepted ??
              0,
            ),

          rejected:
            Number(
              summary.rejected ??
              0,
            ),

          archived:
            Number(
              summary.archived ??
              0,
            ),
        },

        pagination: {
          page,

          limit,

          total:
            totalFiltered,

          totalPages:
            Math.max(
              1,

              Math.ceil(
                totalFiltered /
                limit,
              ),
            ),
        },

        applications:
          (
            result.rows as
              ApplicationRow[]
          ).map(
            mapApplication,
          ),
      });
    } catch (
      error
    ) {
      next(
        error,
      );
    }
  },
);

/* =========================================================
   GET ONE
   ========================================================= */

router.get(
  "/:id",

  async (
    req,
    res,
    next,
  ) => {
    try {
      const parsedId =
        idSchema.safeParse(
          req.params.id,
        );

      if (
        !parsedId.success
      ) {
        errorResponse(
          res,
          400,
          "INVALID_APPLICATION_ID",
          "Invalid application id.",
          "የapplication id ትክክል አይደለም።",
        );

        return;
      }

      const result =
        await db.query(
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

              motivation,

              id_type,

              id_front_public_id,
              id_front_format,

              id_back_public_id,
              id_back_format,

              status,
              admin_notes,

              rules_accepted,
              rules_accepted_at,

              reviewed_at,
              reviewed_by_admin_id,

              created_at,
              updated_at
            FROM sales_representative_applications
            WHERE id = $1::uuid
            LIMIT 1
          `,
          [
            parsedId.data,
          ],
        );

      if (
        !result.rowCount
      ) {
        errorResponse(
          res,
          404,
          "APPLICATION_NOT_FOUND",
          "Application not found.",
          "Application አልተገኘም።",
        );

        return;
      }

      res.json({
        success:
          true,

        application:
          mapApplication(
            result
              .rows[0] as
              ApplicationRow,
          ),
      });
    } catch (
      error
    ) {
      next(
        error,
      );
    }
  },
);

/* =========================================================
   PRIVATE IDENTIFICATION DOCUMENT
   ========================================================= */

router.get(
  "/:id/document/:side",

  async (
    req,
    res,
    next,
  ) => {
    try {
      const parsedId =
        idSchema.safeParse(
          req.params.id,
        );

      const parsedSide =
        documentSideSchema.safeParse(
          req.params.side,
        );

      if (
        !parsedId.success ||
        !parsedSide.success
      ) {
        errorResponse(
          res,
          400,
          "INVALID_DOCUMENT_REQUEST",
          "Invalid document request.",
          "የdocument request ትክክል አይደለም።",
        );

        return;
      }

      const result =
        await db.query(
          `
            SELECT
              id_front_public_id,
              id_front_format,

              id_back_public_id,
              id_back_format
            FROM sales_representative_applications
            WHERE id = $1::uuid
            LIMIT 1
          `,
          [
            parsedId.data,
          ],
        );

      if (
        !result.rowCount
      ) {
        errorResponse(
          res,
          404,
          "APPLICATION_NOT_FOUND",
          "Application not found.",
          "Application አልተገኘም።",
        );

        return;
      }

      const row =
        result.rows[0];

      const isFront =
        parsedSide.data ===
        "front";

      const publicId =
        isFront
          ? row
              .id_front_public_id
          : row
              .id_back_public_id;

      const format =
        isFront
          ? row
              .id_front_format
          : row
              .id_back_format;

      if (
        !publicId ||
        !format
      ) {
        errorResponse(
          res,
          404,
          "DOCUMENT_NOT_FOUND",
          "Identification document not found.",
          "የመታወቂያ document አልተገኘም።",
        );

        return;
      }

      const expiresAt =
        Math.floor(
          Date.now() /
            1000,
        ) +
        5 *
          60;

      const url =
        cloudinary.utils
          .private_download_url(
            publicId,
            format,
            {
              resource_type:
                "image",

              type:
                "authenticated",

              expires_at:
                expiresAt,

              attachment:
                false,
            },
          );

      res.json({
        success:
          true,

        url,

        expiresAt,
      });
    } catch (
      error
    ) {
      next(
        error,
      );
    }
  },
);

/* =========================================================
   UPDATE STATUS / NOTES
   ========================================================= */

router.patch(
  "/:id/status",

  async (
    req,
    res,
    next,
  ) => {
    try {
      const parsedId =
        idSchema.safeParse(
          req.params.id,
        );

      if (
        !parsedId.success
      ) {
        errorResponse(
          res,
          400,
          "INVALID_APPLICATION_ID",
          "Invalid application id.",
          "የapplication id ትክክል አይደለም።",
        );

        return;
      }

      const parsedBody =
        updateStatusSchema.safeParse(
          req.body,
        );

      if (
        !parsedBody.success
      ) {
        errorResponse(
          res,
          400,
          "INVALID_APPLICATION_UPDATE",
          "Invalid application update.",
          "የapplication update ትክክል አይደለም።",
        );

        return;
      }

      const {
        status,
        adminNotes,
      } =
        parsedBody.data;

      /* ===================================================
         ACCEPTED MUST USE ONBOARDING
         =================================================== */

      if (
        status ===
        "accepted"
      ) {
        errorResponse(
          res,
          409,
          "USE_REPRESENTATIVE_ONBOARDING",
          "Use Accept & Create to accept this applicant. Acceptance must create the Partner account first.",
          "Applicantን accept ለማድረግ Accept & Create ይጠቀሙ። Partner account መጀመሪያ መፈጠር አለበት።",
        );

        return;
      }

      /* ===================================================
         REJECTION REASON REQUIRED
         =================================================== */

      if (
        status ===
          "rejected" &&
        !adminNotes?.trim()
      ) {
        errorResponse(
          res,
          400,
          "REJECTION_REASON_REQUIRED",
          "Write the rejection reason before rejecting the application.",
          "Applicationን reject ከማድረግዎ በፊት rejection reason ይጻፉ።",
        );

        return;
      }

      const adminId =
        req.auth?.id;

      if (
        !adminId
      ) {
        errorResponse(
          res,
          401,
          "AUTH_REQUIRED",
          "Authentication required.",
          "Authentication ያስፈልጋል።",
        );

        return;
      }

      /* ===================================================
         GET CURRENT STATUS
         =================================================== */

      const currentResult =
        await db.query(
          `
            SELECT
              id,
              status
            FROM sales_representative_applications
            WHERE id = $1::uuid
            LIMIT 1
          `,
          [
            parsedId.data,
          ],
        );

      if (
        !currentResult.rowCount
      ) {
        errorResponse(
          res,
          404,
          "APPLICATION_NOT_FOUND",
          "Application not found.",
          "Application አልተገኘም።",
        );

        return;
      }

      const previousStatus =
        currentResult
          .rows[0]
          .status as
          ApplicationStatus;

      /* ===================================================
         UPDATE

         Explicit parameter types prevent PostgreSQL from
         trying to infer multiple incompatible types.

         $1 = status      -> varchar
         $2 = notes       -> text
         $3 = admin id    -> uuid
         $4 = application -> uuid
         =================================================== */

      const result =
        await db.query(
          `
            UPDATE sales_representative_applications
            SET
              status =
                $1::varchar,

              admin_notes =
                COALESCE(
                  $2::text,
                  admin_notes
                ),

              reviewed_at =
                CASE
                  WHEN $1::varchar = 'pending'
                    THEN NULL

                  ELSE COALESCE(
                    reviewed_at,
                    NOW()
                  )
                END,

              reviewed_by_admin_id =
                CASE
                  WHEN $1::varchar = 'pending'
                    THEN NULL::uuid

                  ELSE $3::uuid
                END,

              updated_at =
                NOW()

            WHERE id =
              $4::uuid

            RETURNING
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

              motivation,

              id_type,

              id_front_public_id,
              id_front_format,

              id_back_public_id,
              id_back_format,

              status,
              admin_notes,

              rules_accepted,
              rules_accepted_at,

              reviewed_at,
              reviewed_by_admin_id,

              created_at,
              updated_at
          `,
          [
            status,

            adminNotes ??
              null,

            adminId,

            parsedId.data,
          ],
        );

      if (
        !result.rowCount
      ) {
        errorResponse(
          res,
          404,
          "APPLICATION_NOT_FOUND",
          "Application not found.",
          "Application አልተገኘም።",
        );

        return;
      }

      const row =
        result
          .rows[0] as
          ApplicationRow;

      const statusChanged =
        previousStatus !==
        row.status;

      let emailSent:
        boolean |
        null =
        null;

      /* ===================================================
         STATUS EMAIL
         =================================================== */

      if (
        statusChanged
      ) {
        const applicationCode =
          formatApplicationCode(
            row.application_number,
          );

        const eventId =
          new Date(
            row.updated_at,
          )
            .getTime()
            .toString();

        /* =================================================
           PENDING / REVIEWING
           ================================================= */

        if (
          row.status ===
            "pending" ||
          row.status ===
            "reviewing"
        ) {
          emailSent =
            await sendApplicationUnderReviewEmail({
              applicationId:
                row.id,

              applicationCode,

              email:
                row.email,

              fullName:
                row.full_name,

              eventId,
            });
        }

        /* =================================================
           REJECTED
           ================================================= */

        else if (
          row.status ===
          "rejected"
        ) {
          const rejectionReason =
            row.admin_notes
              ?.trim();

          if (
            rejectionReason
          ) {
            emailSent =
              await sendApplicationRejectedEmail({
                applicationId:
                  row.id,

                applicationCode,

                email:
                  row.email,

                fullName:
                  row.full_name,

                reason:
                  rejectionReason,

                eventId,
              });
          }
        }
      }

      /* ===================================================
         RESPONSE
         =================================================== */

      res.json({
        success:
          true,

        emailSent,

        application:
          mapApplication(
            row,
          ),

        message: {
          en:
            statusChanged &&
            emailSent ===
              true
              ? "Application updated successfully and the applicant was notified by email."
              : statusChanged &&
                  emailSent ===
                    false
                ? "Application updated successfully, but the notification email could not be sent."
                : "Application updated successfully.",

          am:
            statusChanged &&
            emailSent ===
              true
              ? "Application በተሳካ ሁኔታ ተቀይሯል እና applicantው በemail ተነግሮታል።"
              : statusChanged &&
                  emailSent ===
                    false
                ? "Application በተሳካ ሁኔታ ተቀይሯል፣ ነገር ግን notification email መላክ አልተቻለም።"
                : "Application በተሳካ ሁኔታ ተቀይሯል።",
        },
      });
    } catch (
      error
    ) {
      next(
        error,
      );
    }
  },
);

export default router;