import {
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

import {
  Router,
} from "express";

import {
  rateLimit,
} from "express-rate-limit";

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
  requireRepresentative,
  requireRepresentativeReady,
} from "../middleware/representative-auth.middleware.js";

import {
  recordPartnerActivity,
} from "../services/partner-activity.service.js";

const router =
  Router();

const MAX_AVATAR_BYTES =
  5 *
  1024 *
  1024;

const AVATAR_SIZE =
  512;

const ALLOWED_FORMATS =
  new Set([
    "jpg",
    "jpeg",
    "png",
    "webp",
  ]);

const writeRateLimit =
  rateLimit({
    windowMs:
      15 *
      60 *
      1000,

    limit:
      60,

    standardHeaders:
      true,

    legacyHeaders:
      false,
  });

const profileSchema =
  z
    .object({
      displayName:
        z
          .string()
          .trim()
          .max(160),

      preferredLanguage:
        z.enum([
          "en",
          "am",
        ]),
    })
    .strict()
    .superRefine(
      (
        input,
        context,
      ) => {
        if (
          input.displayName.length >
            0 &&
          input.displayName.length <
            2
        ) {
          context.addIssue({
            code:
              "custom",

            path: [
              "displayName",
            ],

            message:
              "Display name must contain at least two characters.",
          });
        }
      },
    );

const avatarConfirmationSchema =
  z
    .object({
      publicId:
        z
          .string()
          .trim()
          .min(1)
          .max(500),

      version:
        z
          .number()
          .int()
          .positive(),

      signature:
        z
          .string()
          .regex(
            /^[a-f0-9]{40}$/i,
          ),
    })
    .strict();

router.use(
  requireRepresentative,
  requireRepresentativeReady,
);

function avatarFolder(
  representativeId:
    string,
) {
  const token =
    createHmac(
      "sha256",
      env.JWT_SECRET,
    )
      .update(
        `representative-avatar:${representativeId}`,
      )
      .digest(
        "hex",
      )
      .slice(
        0,
        24,
      );

  return `${env.CLOUDINARY_REPRESENTATIVE_AVATAR_FOLDER}/${token}`;
}

function avatarUrl(
  publicId:
    string |
    null,

  version:
    number |
    null,

  format:
    string |
    null,
) {
  if (
    !publicId
  ) {
    return null;
  }

  return cloudinary.url(
    publicId,
    {
      secure:
        true,

      version:
        version ??
        undefined,

      format:
        format ??
        undefined,

      transformation: [
        {
          width:
            AVATAR_SIZE,

          height:
            AVATAR_SIZE,

          crop:
            "fill",

          gravity:
            "auto",
        },

        {
          quality:
            "auto",

          fetch_format:
            "auto",
        },
      ],
    },
  );
}

async function safelyDeleteAvatar(
  representativeId:
    string,

  publicId:
    string |
    null |
    undefined,
) {
  if (
    !publicId ||
    !publicId.startsWith(
      `${avatarFolder(
        representativeId,
      )}/`,
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

        invalidate:
          true,
      },
    );
  } catch (
    error
  ) {
    console.error(
      "Representative avatar cleanup failed:",
      error instanceof
        Error
        ? error.message
        : "Unknown Cloudinary cleanup error.",
    );
  }
}

function signaturesMatch(
  actual:
    string,

  expected:
    string,
) {
  const actualBuffer =
    Buffer.from(
      actual,
      "utf8",
    );

  const expectedBuffer =
    Buffer.from(
      expected,
      "utf8",
    );

  return (
    actualBuffer.length ===
      expectedBuffer.length &&
    timingSafeEqual(
      actualBuffer,
      expectedBuffer,
    )
  );
}

function mapProfile(
  row:
    Record<
      string,
      unknown
    >,
) {
  return {
    partnerId:
      row.username,

    legalName:
      row.name,

    displayName:
      row.display_name ??
      "",

    effectiveName:
      row.display_name ||
      row.name,

    email:
      row.email,

    phone:
      row.phone,

    city:
      row.city,

    preferredLanguage:
      row.preferred_language ??
      "en",

    avatarUrl:
      avatarUrl(
        row.avatar_public_id as
          | string
          | null,
        row.avatar_version ===
          null
          ? null
          : Number(
              row.avatar_version,
            ),
        row.avatar_format as
          | string
          | null,
      ),

    createdAt:
      row.created_at,

    lastLoginAt:
      row.last_login_at ??
      null,
  };
}

async function loadProfile(
  representativeId:
    string,
) {
  const result =
    await db.query(
      `
        SELECT
          username,
          name,
          display_name,
          email,
          phone,
          city,
          preferred_language,
          avatar_public_id,
          avatar_format,
          avatar_version,
          created_at,
          last_login_at
        FROM sales_representatives
        WHERE id = $1::uuid
        LIMIT 1
      `,
      [
        representativeId,
      ],
    );

  return result.rows[0]
    ? mapProfile(
        result.rows[0],
      )
    : null;
}

router.get(
  "/",

  async (
    req,
    res,
    next,
  ) => {
    try {
      const profile =
        await loadProfile(
          req.auth!.id,
        );

      if (
        !profile
      ) {
        res.status(404).json({
          success:
            false,

          message:
            "Partner profile not found.",
        });

        return;
      }

      res.json({
        success:
          true,

        profile,
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

router.patch(
  "/",

  writeRateLimit,

  async (
    req,
    res,
    next,
  ) => {
    const parsed =
      profileSchema.safeParse(
        req.body,
      );

    if (
      !parsed.success
    ) {
      res.status(400).json({
        success:
          false,

        message: {
          en:
            "Check your profile information and try again.",

          am:
            "á‹¨áŒáˆ áˆ˜áˆ¨áŒƒá‹ŽáŠ• á‹«áˆ¨áŒ‹áŒáŒ¡ áŠ¥áŠ“ áŠ¥áŠ•á‹°áŒˆáŠ“ á‹­áˆžáŠ­áˆ©á¢",
        },
      });

      return;
    }

    try {
      const result =
        await db.query(
          `
            UPDATE sales_representatives
            SET
              display_name = NULLIF($2::varchar, ''),
              preferred_language = $3::varchar,
              updated_at = NOW()
            WHERE id = $1::uuid
            RETURNING id
          `,
          [
            req.auth!.id,
            parsed.data.displayName,
            parsed.data.preferredLanguage,
          ],
        );

      if (
        !result.rows[0]
      ) {
        res.status(404).json({
          success:
            false,

          message:
            "Partner profile not found.",
        });

        return;
      }

      await recordPartnerActivity({
        eventType:
          "profile_updated",

        actorType:
          "representative",

        representativeId:
          req.auth!.id,

        metadata: {
          label:
            "Profile preferences updated",
        },
      });

      const profile =
        await loadProfile(
          req.auth!.id,
        );

      res.json({
        success:
          true,

        profile,
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

router.post(
  "/avatar/upload-signature",

  writeRateLimit,

  async (
    req,
    res,
    next,
  ) => {
    try {
      const timestamp =
        Math.floor(
          Date.now() /
            1000,
        );

      const parameters = {
        timestamp,

        folder:
          avatarFolder(
            req.auth!.id,
          ),

        public_id:
          randomUUID(),

        allowed_formats:
          "jpg,png,webp",

        max_file_size:
          MAX_AVATAR_BYTES,

        transformation:
          `c_fill,g_auto,h_${AVATAR_SIZE},w_${AVATAR_SIZE}`,
      };

      const signature =
        cloudinary.utils.api_sign_request(
          parameters,
          env.CLOUDINARY_API_SECRET,
        );

      res.json({
        success:
          true,

        uploadUrl:
          `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,

        apiKey:
          env.CLOUDINARY_API_KEY,

        signature,

        parameters,

        constraints: {
          maxBytes:
            MAX_AVATAR_BYTES,

          formats: [
            "jpg",
            "png",
            "webp",
          ],

          width:
            AVATAR_SIZE,

          height:
            AVATAR_SIZE,
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

router.post(
  "/avatar/confirm",

  writeRateLimit,

  async (
    req,
    res,
    next,
  ) => {
    const parsed =
      avatarConfirmationSchema.safeParse(
        req.body,
      );

    if (
      !parsed.success
    ) {
      res.status(400).json({
        success:
          false,

        message:
          "The uploaded profile picture is invalid.",
      });

      return;
    }

    const expectedFolder =
      avatarFolder(
        req.auth!.id,
      );

    if (
      !parsed.data.publicId.startsWith(
        `${expectedFolder}/`,
      )
    ) {
      res.status(400).json({
        success:
          false,

        message:
          "The uploaded profile picture is invalid.",
      });

      return;
    }

    const expectedSignature =
      cloudinary.utils.api_sign_request(
        {
          public_id:
            parsed.data.publicId,

          version:
            parsed.data.version,
        },
        env.CLOUDINARY_API_SECRET,
      );

    if (
      !signaturesMatch(
        parsed.data.signature,
        expectedSignature,
      )
    ) {
      res.status(400).json({
        success:
          false,

        message:
          "The uploaded profile picture could not be verified.",
      });

      return;
    }

    let avatarPersisted =
      false;

    try {
      const resource =
        await cloudinary.api.resource(
          parsed.data.publicId,
          {
            resource_type:
              "image",
          },
        );

      const format =
        String(
          resource.format ??
            "",
        ).toLowerCase();

      const valid =
        resource.resource_type ===
          "image" &&
        String(
          resource.public_id ??
            "",
        ) ===
          parsed.data.publicId &&
        Number(
          resource.version,
        ) ===
          parsed.data.version &&
        ALLOWED_FORMATS.has(
          format,
        ) &&
        Number(
          resource.bytes ??
            0,
        ) >
          0 &&
        Number(
          resource.bytes ??
            0,
        ) <=
          MAX_AVATAR_BYTES &&
        Number(
          resource.width ??
            0,
        ) ===
          AVATAR_SIZE &&
        Number(
          resource.height ??
            0,
        ) ===
          AVATAR_SIZE;

      if (
        !valid
      ) {
        await safelyDeleteAvatar(
          req.auth!.id,
          parsed.data.publicId,
        );

        res.status(400).json({
          success:
            false,

          message:
            "Use a JPG, PNG, or WebP image no larger than 5 MB.",
        });

        return;
      }

      const previousResult =
        await db.query(
          `
            SELECT avatar_public_id
            FROM sales_representatives
            WHERE id = $1::uuid
            LIMIT 1
          `,
          [
            req.auth!.id,
          ],
        );

      if (
        !previousResult.rows[0]
      ) {
        await safelyDeleteAvatar(
          req.auth!.id,
          parsed.data.publicId,
        );

        res.status(404).json({
          success:
            false,

          message:
            "Partner profile not found.",
        });

        return;
      }

      const previousPublicId =
        previousResult.rows[0]
          .avatar_public_id as
          | string
          | null;

      const updateResult =
        await db.query(
          `
            UPDATE sales_representatives
            SET
              avatar_public_id = $2::varchar,
              avatar_format = $3::varchar,
              avatar_version = $4::bigint,
              updated_at = NOW()
            WHERE id = $1::uuid
            RETURNING id
          `,
          [
            req.auth!.id,
            parsed.data.publicId,
            format ===
              "jpeg"
              ? "jpg"
              : format,
            parsed.data.version,
          ],
        );

      if (
        !updateResult.rows[0]
      ) {
        await safelyDeleteAvatar(
          req.auth!.id,
          parsed.data.publicId,
        );

        res.status(404).json({
          success:
            false,

          message:
            "Partner profile not found.",
        });

        return;
      }

      avatarPersisted =
        true;

      if (
        previousPublicId &&
        previousPublicId !==
          parsed.data.publicId
      ) {
        await safelyDeleteAvatar(
          req.auth!.id,
          previousPublicId,
        );
      }

      await recordPartnerActivity({
        eventType:
          "avatar_updated",

        actorType:
          "representative",

        representativeId:
          req.auth!.id,

        metadata: {
          label:
            "Profile picture updated",
        },
      });

      const profile =
        await loadProfile(
          req.auth!.id,
        );

      res.json({
        success:
          true,

        profile,
      });
    } catch (
      error
    ) {
      if (
        !avatarPersisted
      ) {
        await safelyDeleteAvatar(
          req.auth!.id,
          parsed.data.publicId,
        );
      }

      next(
        error,
      );
    }
  },
);

router.delete(
  "/avatar",

  writeRateLimit,

  async (
    req,
    res,
    next,
  ) => {
    try {
      const previousResult =
        await db.query(
          `
            SELECT avatar_public_id
            FROM sales_representatives
            WHERE id = $1::uuid
            LIMIT 1
          `,
          [
            req.auth!.id,
          ],
        );

      if (
        !previousResult.rows[0]
      ) {
        res.status(404).json({
          success:
            false,

          message:
            "Partner profile not found.",
        });

        return;
      }

      const publicId =
        previousResult.rows[0]
          .avatar_public_id as
          | string
          | null;

      const result =
        await db.query(
          `
            UPDATE sales_representatives
            SET
              avatar_public_id = NULL,
              avatar_format = NULL,
              avatar_version = NULL,
              updated_at = NOW()
            WHERE id = $1::uuid
            RETURNING id
          `,
          [
            req.auth!.id,
          ],
        );

      if (
        !result.rows[0]
      ) {
        res.status(404).json({
          success:
            false,

          message:
            "Partner profile not found.",
        });

        return;
      }

      await safelyDeleteAvatar(
        req.auth!.id,
        publicId,
      );

      await recordPartnerActivity({
        eventType:
          "avatar_deleted",

        actorType:
          "representative",

        representativeId:
          req.auth!.id,

        metadata: {
          label:
            "Profile picture removed",
        },
      });

      const profile =
        await loadProfile(
          req.auth!.id,
        );

      res.json({
        success:
          true,

        profile,
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
