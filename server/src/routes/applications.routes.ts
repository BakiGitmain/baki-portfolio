import {
  createHmac,
  randomUUID,
} from "node:crypto";

import {
  Router,
  type Response,
} from "express";

import {
  rateLimit,
} from "../middleware/rate-limit.middleware.js";

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
  env,
} from "../config/env.js";

import {
  sendApplicationSubmittedEmail,
} from "../services/application-email.service.js";

/* =========================================================
   ROUTER
   ========================================================= */

const router =
  Router();

/* =========================================================
   CONSTANTS
   ========================================================= */

const MAX_ID_IMAGE_BYTES =
  8 *
  1024 *
  1024;

const ALLOWED_ID_FORMATS =
  new Set([
    "jpg",
    "jpeg",
    "png",
    "webp",
  ]);

const ACTIVE_APPLICATION_STATUSES =
  [
    "pending",
    "reviewing",
    "accepted",
  ] as const;

/* =========================================================
   RATE LIMITS
   ========================================================= */

const uploadSignatureLimiter =
  rateLimit({
    windowMs:
      60 *
      60 *
      1000,

    limit:
      6,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      success:
        false,

      code:
        "UPLOAD_RATE_LIMITED",

      message: {
        en:
          "Too many upload attempts. Please try again later.",

        am:
          "በጣም ብዙ upload ሙከራዎች ተደርገዋል። እባክዎ ቆይተው እንደገና ይሞክሩ።",
      },
    },
  });

const submitApplicationLimiter =
  rateLimit({
    windowMs:
      24 *
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
        "APPLICATION_RATE_LIMITED",

      message: {
        en:
          "Too many application attempts. Please try again later.",

        am:
          "በጣም ብዙ የማመልከቻ ሙከራዎች ተደርገዋል። እባክዎ ቆይተው እንደገና ይሞክሩ።",
      },
    },
  });

/* =========================================================
   RESPONSE HELPER
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

/* =========================================================
   NORMALIZATION
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

/* =========================================================
   PRIVATE REQUEST HASH
   ========================================================= */

function hashPrivateValue(
  value:
    string,
) {
  return createHmac(
    "sha256",
    env.JWT_SECRET,
  )
    .update(
      value,
    )
    .digest(
      "hex",
    );
}

/* =========================================================
   APPLICATION CODE
   ========================================================= */

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
   CLOUDINARY HELPERS
   ========================================================= */

function getIdPublicId(
  uploadId:
    string,

  side:
    "front" |
    "back",
) {
  return [
    env
      .CLOUDINARY_APPLICATION_ID_FOLDER,

    uploadId,

    `id-${side}`,
  ].join(
    "/",
  );
}

function publicIdBelongsToUpload(
  publicId:
    string,

  uploadId:
    string,

  side:
    "front" |
    "back",
) {
  return (
    publicId ===
    getIdPublicId(
      uploadId,
      side,
    )
  );
}

/* =========================================================
   VERIFY CLOUDINARY IMAGE
   ========================================================= */

async function verifyIdImage(
  publicId:
    string,
) {
  const resource =
    await cloudinary.api.resource(
      publicId,
      {
        resource_type:
          "image",

        type:
          "authenticated",
      },
    );

  const format =
    String(
      resource.format ??
        "",
    ).toLowerCase();

  const bytes =
    Number(
      resource.bytes ??
        0,
    );

  if (
    resource.resource_type !==
      "image" ||
    resource.type !==
      "authenticated" ||
    !ALLOWED_ID_FORMATS.has(
      format,
    ) ||
    bytes <=
      0 ||
    bytes >
      MAX_ID_IMAGE_BYTES ||
    typeof resource.public_id !==
      "string" ||
    resource.public_id !==
      publicId
  ) {
    throw new Error(
      "INVALID_ID_IMAGE",
    );
  }

  return {
    publicId:
      resource.public_id,

    format,
  };
}

/* =========================================================
   CLEANUP
   ========================================================= */

async function safelyDeleteIdImage(
  publicId:
    string |
    null |
    undefined,
) {
  if (
    !publicId
  ) {
    return;
  }

  const requiredPrefix =
    `${
      env
        .CLOUDINARY_APPLICATION_ID_FOLDER
    }/`;

  if (
    !publicId.startsWith(
      requiredPrefix,
    )
  ) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(
      publicId,
      {
        resource_type:
          "image",

        type:
          "authenticated",

        invalidate:
          true,
      },
    );
  } catch (
    error
  ) {
    console.error(
      "Unable to clean up application ID image:",
      error,
    );
  }
}

async function safelyDeleteIdImages(
  publicIds:
    string[],
) {
  await Promise.allSettled(
    publicIds.map(
      (
        publicId,
      ) =>
        safelyDeleteIdImage(
          publicId,
        ),
    ),
  );
}

/* =========================================================
   VALIDATION
   ========================================================= */

const phoneSchema =
  z
    .string()
    .trim()
    .min(1)
    .max(40)
    .refine(
      (
        value,
      ) =>
        /^\+?\d{9,15}$/.test(
          normalizePhone(
            value,
          ),
        ),

      "Invalid phone number.",
    );

const optionalPhoneSchema =
  z
    .string()
    .trim()
    .max(40)
    .refine(
      (
        value,
      ) =>
        !value ||
        /^\+?\d{9,15}$/.test(
          normalizePhone(
            value,
          ),
        ),

      "Invalid phone number.",
    );

const applicationSchema =
  z
    .object({
      fullName: z
        .string()
        .trim()
        .min(2)
        .max(160),

      fatherName: z
        .string()
        .trim()
        .min(2)
        .max(160),

      email: z
        .string()
        .trim()
        .email()
        .max(254),

      phone:
        phoneSchema,

      city: z
        .string()
        .trim()
        .min(1)
        .max(120),

      address: z
        .string()
        .trim()
        .min(2)
        .max(255),

      telegram: z
        .string()
        .trim()
        .max(160),

      whatsapp:
        optionalPhoneSchema,

      motivation: z
        .string()
        .trim()
        .min(20)
        .max(200),

      idType: z.enum([
        "Fayda ID",
        "Passport",
        "Driver's License",
        "Kebele / Government ID",
        "Other Government-Issued ID",
      ]),

      idUploadId: z
        .string()
        .uuid(),

      idFrontPublicId: z
        .string()
        .trim()
        .min(1),

      idBackPublicId: z
        .string()
        .trim()
        .min(1),

      acceptedRules:
        z.literal(
          true,
        ),
    })
    .superRefine(
      (
        value,
        context,
      ) => {
        if (
          !value.telegram &&
          !value.whatsapp
        ) {
          context.addIssue({
            code:
              "custom",

            path: [
              "telegram",
            ],

            message:
              "Telegram or WhatsApp is required.",
          });
        }
      },
    );

/* =========================================================
   UPLOAD SIGNATURE
   ========================================================= */

router.post(
  "/upload-signature",

  uploadSignatureLimiter,

  (
    _req,
    res,
  ) => {
    const uploadId =
      randomUUID();

    const timestamp =
      Math.floor(
        Date.now() /
          1000,
      );

    const frontPublicId =
      getIdPublicId(
        uploadId,
        "front",
      );

    const backPublicId =
      getIdPublicId(
        uploadId,
        "back",
      );

    const frontParameters = {
      timestamp,

      public_id:
        frontPublicId,

      type:
        "authenticated",

      overwrite:
        false,
    };

    const backParameters = {
      timestamp,

      public_id:
        backPublicId,

      type:
        "authenticated",

      overwrite:
        false,
    };

    const frontSignature =
      cloudinary.utils
        .api_sign_request(
          frontParameters,

          env
            .CLOUDINARY_API_SECRET,
        );

    const backSignature =
      cloudinary.utils
        .api_sign_request(
          backParameters,

          env
            .CLOUDINARY_API_SECRET,
        );

    res.json({
      success:
        true,

      uploadId,

      cloudName:
        env
          .CLOUDINARY_CLOUD_NAME,

      apiKey:
        env
          .CLOUDINARY_API_KEY,

      uploadUrl:
        `https://api.cloudinary.com/v1_1/${
          env
            .CLOUDINARY_CLOUD_NAME
        }/image/upload`,

      assets: {
        front: {
          publicId:
            frontPublicId,

          timestamp,

          signature:
            frontSignature,

          type:
            "authenticated",

          overwrite:
            false,
        },

        back: {
          publicId:
            backPublicId,

          timestamp,

          signature:
            backSignature,

          type:
            "authenticated",

          overwrite:
            false,
        },
      },
    });
  },
);

/* =========================================================
   SUBMIT APPLICATION
   ========================================================= */

router.post(
  "/",

  submitApplicationLimiter,

  async (
    req,
    res,
    next,
  ) => {
    const parsed =
      applicationSchema.safeParse(
        req.body,
      );

    if (
      !parsed.success
    ) {
      errorResponse(
        res,
        400,
        "INVALID_APPLICATION",
        "Please check the application information and try again.",
        "እባክዎ የማመልከቻውን መረጃ ያረጋግጡ እና እንደገና ይሞክሩ።",
      );

      return;
    }

    const input =
      parsed.data;

    const emailNormalized =
      normalizeEmail(
        input.email,
      );

    const phoneNormalized =
      normalizePhone(
        input.phone,
      );

    const whatsappNormalized =
      input.whatsapp
        ? normalizePhone(
            input.whatsapp,
          )
        : "";

    const uploadedPublicIds =
      [
        input
          .idFrontPublicId,

        input
          .idBackPublicId,
      ];

    /*
      If the DB insert succeeds, never delete the ID files
      because of a later email/network problem.
    */

    let applicationSaved =
      false;

    try {
      /* ===================================================
         VALIDATE PUBLIC IDS
         =================================================== */

      if (
        !publicIdBelongsToUpload(
          input
            .idFrontPublicId,

          input
            .idUploadId,

          "front",
        ) ||
        !publicIdBelongsToUpload(
          input
            .idBackPublicId,

          input
            .idUploadId,

          "back",
        )
      ) {
        errorResponse(
          res,
          400,
          "INVALID_ID_UPLOAD",
          "The identification upload is invalid. Please upload your ID again.",
          "የመታወቂያ upload ትክክል አይደለም። እባክዎ IDዎን እንደገና upload ያድርጉ።",
        );

        return;
      }

      /* ===================================================
         VERIFY BOTH ASSETS
         =================================================== */

      let frontImage:
        Awaited<
          ReturnType<
            typeof verifyIdImage
          >
        >;

      let backImage:
        Awaited<
          ReturnType<
            typeof verifyIdImage
          >
        >;

      try {
        [
          frontImage,
          backImage,
        ] =
          await Promise.all([
            verifyIdImage(
              input
                .idFrontPublicId,
            ),

            verifyIdImage(
              input
                .idBackPublicId,
            ),
          ]);
      } catch {
        errorResponse(
          res,
          400,
          "INVALID_ID_IMAGE",
          "One or more identification images are invalid. Upload clear JPG, PNG or WEBP images smaller than 8 MB.",
          "ከተላኩት የመታወቂያ ምስሎች አንዱ ወይም ከዚያ በላይ ትክክል አይደለም። ከ8 MB በታች JPG፣ PNG ወይም WEBP ምስል upload ያድርጉ።",
        );

        return;
      }

      /* ===================================================
         DUPLICATE CHECK
         =================================================== */

      const duplicate =
        await db.query(
          `
            SELECT
              id,
              application_number,
              status
            FROM sales_representative_applications
            WHERE
              (
                email_normalized = $1
                OR
                phone_normalized = $2
              )
              AND status = ANY($3::text[])
            ORDER BY created_at DESC
            LIMIT 1
          `,
          [
            emailNormalized,

            phoneNormalized,

            ACTIVE_APPLICATION_STATUSES,
          ],
        );

      if (
        duplicate.rowCount &&
        duplicate.rowCount >
          0
      ) {
        await safelyDeleteIdImages(
          uploadedPublicIds,
        );

        const existing =
          duplicate.rows[0];

        res
          .status(
            409,
          )
          .json({
            success:
              false,

            code:
              "ACTIVE_APPLICATION_EXISTS",

            applicationCode:
              formatApplicationCode(
                existing
                  .application_number,
              ),

            status:
              existing.status,

            message: {
              en:
                "An active application already exists for this email address or phone number.",

              am:
                "በዚህ email ወይም phone number ላይ አስቀድሞ active application አለ።",
            },
          });

        return;
      }

      /* ===================================================
         REQUEST AUDIT HASHES
         =================================================== */

      const ipValue =
        req.ip ||
        "unknown";

      const userAgent =
        req.get(
          "user-agent",
        ) ||
        "unknown";

      const submissionIpHash =
        hashPrivateValue(
          ipValue,
        );

      const userAgentHash =
        hashPrivateValue(
          userAgent,
        );

      /* ===================================================
         INSERT
         =================================================== */

      const result =
        await db.query(
          `
            INSERT INTO sales_representative_applications (
              full_name,
              father_name,

              email,
              email_normalized,

              phone,
              phone_normalized,

              city,
              address,

              telegram,
              whatsapp,

              motivation,

              id_type,
              id_upload_id,

              id_front_public_id,
              id_front_format,

              id_back_public_id,
              id_back_format,

              rules_accepted,
              rules_accepted_at,

              submission_ip_hash,
              user_agent_hash
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
              $15,

              $16,
              $17,

              TRUE,
              NOW(),

              $18,
              $19
            )
            RETURNING
              id,
              application_number,
              status,
              created_at
          `,
          [
            input.fullName,
            input.fatherName,

            input.email.trim(),
            emailNormalized,

            input.phone.trim(),
            phoneNormalized,

            input.city,
            input.address,

            input.telegram ||
              null,

            whatsappNormalized ||
              null,

            input.motivation,

            input.idType,
            input.idUploadId,

            frontImage.publicId,
            frontImage.format,

            backImage.publicId,
            backImage.format,

            submissionIpHash,
            userAgentHash,
          ],
        );

      const application =
        result.rows[0];

      applicationSaved =
        true;

      const applicationCode =
        formatApplicationCode(
          application
            .application_number,
        );

      /* ===================================================
         EMAIL

         Email failure does NOT remove the application.
         =================================================== */

      const emailSent =
        await sendApplicationSubmittedEmail({
          applicationId:
            application.id,

          applicationCode,

          email:
            input.email.trim(),

          fullName:
            input.fullName,
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

          application: {
            id:
              application.id,

            applicationCode,

            status:
              application.status,

            submittedAt:
              application.created_at,
          },

          message:
            emailSent
              ? {
                  en:
                    "Application submitted successfully. We sent a confirmation email. Check your email to see your application ID and keep it for reference.",

                  am:
                    "ማመልከቻዎ በተሳካ ሁኔታ ተልኳል። የማረጋገጫ email ልከናል። Application IDዎን ለማየት emailዎን ይመልከቱ እና ለማጣቀሻ ያስቀምጡት።",
                }
              : {
                  en:
                    "Application submitted successfully, but we could not send the confirmation email. Your application is still saved.",

                  am:
                    "ማመልከቻዎ በተሳካ ሁኔታ ተቀምጧል፣ ነገር ግን confirmation email መላክ አልተቻለም። Applicationዎ አሁንም ተቀምጧል።",
                },
        });
    } catch (
      error
    ) {
      if (
        !applicationSaved
      ) {
        await safelyDeleteIdImages(
          uploadedPublicIds,
        );
      }

      next(
        error,
      );
    }
  },
);

export default router;
