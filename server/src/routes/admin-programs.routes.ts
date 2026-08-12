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

import type {
  PoolClient,
} from "pg";

import {
  db,
} from "../config/db.js";

import {
  requireAdmin,
} from "../middleware/auth.middleware.js";

import {
  recordPartnerActivity,
} from "../services/partner-activity.service.js";

import {
  getAdminProgramDetail,
  listAdminPrograms,
} from "../services/partner-program.service.js";

const router =
  Router();

const writeRateLimit =
  rateLimit({
    windowMs:
      15 *
      60 *
      1000,

    limit:
      120,

    standardHeaders:
      true,

    legacyHeaders:
      false,
  });

const uuidSchema =
  z.string().uuid();

const targetSchema =
  z
    .object({
      targetType:
        z.enum([
          "reports",
          "lessons",
          "course_completion",
        ]),

      targetValue:
        z
          .number()
          .int()
          .min(1)
          .max(100000),

      courseId:
        z
          .string()
          .uuid()
          .nullable()
          .optional(),
    })
    .strict()
    .superRefine(
      (
        target,
        context,
      ) => {
        if (
          target.targetType ===
            "course_completion" &&
          !target.courseId
        ) {
          context.addIssue({
            code:
              "custom",

            path: [
              "courseId",
            ],

            message:
              "Choose a course.",
          });
        }

        if (
          target.targetType !==
            "course_completion" &&
          target.courseId
        ) {
          context.addIssue({
            code:
              "custom",

            path: [
              "courseId",
            ],

            message:
              "Only course-completion goals can reference a course.",
          });
        }
      },
    );

const programInputSchema =
  z
    .object({
      title:
        z
          .string()
          .trim()
          .min(1)
          .max(220),

      description:
        z
          .string()
          .trim()
          .max(20000)
          .default(""),

      startDate:
        z
          .string()
          .date(),

      endDate:
        z
          .string()
          .date(),

      status:
        z.enum([
          "draft",
          "scheduled",
          "active",
          "completed",
          "archived",
        ]),

      assignmentScope:
        z.enum([
          "everyone",
          "selected",
        ]),

      representativeIds:
        z
          .array(
            z.string().uuid(),
          )
          .max(1000)
          .default([]),

      icon:
        z
          .enum([
            "target",
            "growth",
            "training",
            "reports",
            "star",
            "calendar",
          ])
          .nullable()
          .optional(),

      targets:
        z
          .array(
            targetSchema,
          )
          .min(1)
          .max(20),
    })
    .strict()
    .superRefine(
      (
        input,
        context,
      ) => {
        if (
          input.endDate <
          input.startDate
        ) {
          context.addIssue({
            code:
              "custom",

            path: [
              "endDate",
            ],

            message:
              "The end date must be on or after the start date.",
          });
        }

        if (
          input.assignmentScope ===
            "selected" &&
          input.representativeIds.length ===
            0
        ) {
          context.addIssue({
            code:
              "custom",

            path: [
              "representativeIds",
            ],

            message:
              "Choose at least one partner.",
          });
        }

        const keys =
          input.targets.map(
            (
              target,
            ) =>
              `${target.targetType}:${target.courseId ?? ""}`,
          );

        if (
          new Set(
            keys,
          ).size !==
          keys.length
        ) {
          context.addIssue({
            code:
              "custom",

            path: [
              "targets",
            ],

            message:
              "Each goal must be unique.",
          });
        }
      },
    );

router.use(
  requireAdmin,
);

function invalidProgram(
  res:
    Response,
) {
  return res.status(400).json({
    success:
      false,

    message: {
      en:
        "Check the program details and goals, then try again.",

      am:
        "á‹¨á•áˆ®áŒáˆ«áˆ™áŠ• áˆ˜áˆ¨áŒƒ áŠ¥áŠ“ áŒá‰¦á‰½ á‹«áˆ¨áŒ‹áŒáŒ¡ áŠ¥áŠ“ áŠ¥áŠ•á‹°áŒˆáŠ“ á‹­áˆžáŠ­áˆ©á¢",
    },
  });
}

async function validateReferences(
  representativeIds:
    string[],

  courseIds:
    string[],
) {
  const [
    representatives,
    courses,
  ] =
    await Promise.all([
      representativeIds.length >
      0
        ? db.query(
            `
              SELECT id
              FROM sales_representatives
              WHERE
                is_active = TRUE
                AND id = ANY($1::uuid[])
            `,
            [
              representativeIds,
            ],
          )
        : Promise.resolve({
            rowCount:
              0,
          }),

      courseIds.length >
      0
        ? db.query(
            `
              SELECT id
              FROM training_courses
              WHERE id = ANY($1::uuid[])
            `,
            [
              courseIds,
            ],
          )
        : Promise.resolve({
            rowCount:
              0,
          }),
    ]);

  return (
    Number(
      representatives.rowCount ??
        0,
    ) ===
      representativeIds.length &&
    Number(
      courses.rowCount ??
        0,
    ) ===
      courseIds.length
  );
}

async function saveProgramRelations(
  client:
    PoolClient,

  programId:
    string,

  adminId:
    string,

  input:
    z.infer<
      typeof programInputSchema
    >,
) {
  await client.query(
    `
      DELETE FROM partner_program_targets
      WHERE program_id = $1::uuid
    `,
    [
      programId,
    ],
  );

  for (
    const [
      index,
      target,
    ] of input.targets.entries()
  ) {
    await client.query(
      `
        INSERT INTO partner_program_targets (
          program_id,
          target_type,
          target_value,
          course_id,
          sort_order
        )
        VALUES (
          $1::uuid,
          $2::varchar,
          $3::int,
          $4::uuid,
          $5::int
        )
      `,
      [
        programId,
        target.targetType,
        target.targetValue,
        target.courseId ??
          null,
        index,
      ],
    );
  }

  await client.query(
    `
      DELETE FROM partner_program_assignments
      WHERE program_id = $1::uuid
    `,
    [
      programId,
    ],
  );

  if (
    input.assignmentScope ===
      "selected"
  ) {
    await client.query(
      `
        INSERT INTO partner_program_assignments (
          program_id,
          representative_id,
          assigned_by_admin_id
        )
        SELECT
          $1::uuid,
          representative_id,
          $2::uuid
        FROM UNNEST($3::uuid[]) AS representative_id
      `,
      [
        programId,
        adminId,
        input.representativeIds,
      ],
    );
  }
}

router.get(
  "/",

  async (
    _req,
    res,
    next,
  ) => {
    try {
      const programs =
        await listAdminPrograms();

      res.json({
        success:
          true,

        programs,
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

router.get(
  "/options",

  async (
    _req,
    res,
    next,
  ) => {
    try {
      const [
        representativeResult,
        courseResult,
      ] =
        await Promise.all([
          db.query(
            `
              SELECT
                id,
                COALESCE(
                  NULLIF(TRIM(display_name), ''),
                  name
                ) AS name,
                username
              FROM sales_representatives
              WHERE is_active = TRUE
              ORDER BY name ASC, username ASC
            `,
          ),

          db.query(
            `
              SELECT
                id,
                title_en,
                title_am,
                status
              FROM training_courses
              ORDER BY sort_order ASC, created_at ASC
            `,
          ),
        ]);

      res.json({
        success:
          true,

        representatives:
          representativeResult.rows.map(
            (
              row,
            ) => ({
              id:
                row.id,

              name:
                row.name,

              partnerId:
                row.username,
            }),
          ),

        courses:
          courseResult.rows.map(
            (
              row,
            ) => ({
              id:
                row.id,

              titleEn:
                row.title_en,

              titleAm:
                row.title_am,

              status:
                row.status,
            }),
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

router.post(
  "/",

  writeRateLimit,

  async (
    req,
    res,
    next,
  ) => {
    const parsed =
      programInputSchema.safeParse(
        req.body,
      );

    if (
      !parsed.success
    ) {
      invalidProgram(
        res,
      );

      return;
    }

    const input =
      parsed.data;

    const representativeIds =
      input.assignmentScope ===
        "selected"
        ? [
            ...new Set(
              input.representativeIds,
            ),
          ]
        : [];

    const courseIds = [
      ...new Set(
        input.targets.flatMap(
          (
            target,
          ) =>
            target.courseId
              ? [
                  target.courseId,
                ]
              : [],
        ),
      ),
    ];

    try {
      if (
        !await validateReferences(
          representativeIds,
          courseIds,
        )
      ) {
        invalidProgram(
          res,
        );

        return;
      }

      const client =
        await db.connect();

      let programId =
        "";

      try {
        await client.query(
          "BEGIN",
        );

        const result =
          await client.query(
            `
              INSERT INTO partner_programs (
                title,
                description,
                start_date,
                end_date,
                status,
                assignment_scope,
                icon,
                created_by_admin_id
              )
              VALUES (
                $1::varchar,
                $2::text,
                $3::date,
                $4::date,
                $5::varchar,
                $6::varchar,
                $7::varchar,
                $8::uuid
              )
              RETURNING id
            `,
            [
              input.title,
              input.description,
              input.startDate,
              input.endDate,
              input.status,
              input.assignmentScope,
              input.icon ??
                null,
              req.auth!.id,
            ],
          );

        programId =
          result.rows[0].id;

        await saveProgramRelations(
          client,
          programId,
          req.auth!.id,
          {
            ...input,
            representativeIds,
          },
        );

        await client.query(
          "COMMIT",
        );
      } catch (
        error
      ) {
        await client.query(
          "ROLLBACK",
        );

        throw error;
      } finally {
        client.release();
      }

      await recordPartnerActivity({
        eventType:
          "program_created",

        actorType:
          "admin",

        adminUserId:
          req.auth!.id,

        programId,

        metadata: {
          label:
            input.title,
        },
      });

      const program =
        await getAdminProgramDetail(
          programId,
        );

      res.status(201).json({
        success:
          true,

        program,
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

router.get(
  "/:programId",

  async (
    req,
    res,
    next,
  ) => {
    const parsedId =
      uuidSchema.safeParse(
        req.params.programId,
      );

    if (
      !parsedId.success
    ) {
      res.status(400).json({
        success:
          false,

        message:
          "Invalid program.",
      });

      return;
    }

    try {
      const program =
        await getAdminProgramDetail(
          parsedId.data,
        );

      if (
        !program
      ) {
        res.status(404).json({
          success:
            false,

          message:
            "Program not found.",
        });

        return;
      }

      res.json({
        success:
          true,

        program,
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
  "/:programId",

  writeRateLimit,

  async (
    req,
    res,
    next,
  ) => {
    const parsedId =
      uuidSchema.safeParse(
        req.params.programId,
      );

    const parsed =
      programInputSchema.safeParse(
        req.body,
      );

    if (
      !parsedId.success ||
      !parsed.success
    ) {
      invalidProgram(
        res,
      );

      return;
    }

    const input =
      parsed.data;

    const representativeIds =
      input.assignmentScope ===
        "selected"
        ? [
            ...new Set(
              input.representativeIds,
            ),
          ]
        : [];

    const courseIds = [
      ...new Set(
        input.targets.flatMap(
          (
            target,
          ) =>
            target.courseId
              ? [
                  target.courseId,
                ]
              : [],
        ),
      ),
    ];

    try {
      if (
        !await validateReferences(
          representativeIds,
          courseIds,
        )
      ) {
        invalidProgram(
          res,
        );

        return;
      }

      const client =
        await db.connect();

      try {
        await client.query(
          "BEGIN",
        );

        const result =
          await client.query(
            `
              UPDATE partner_programs
              SET
                title = $2::varchar,
                description = $3::text,
                start_date = $4::date,
                end_date = $5::date,
                status = $6::varchar,
                assignment_scope = $7::varchar,
                icon = $8::varchar,
                updated_at = NOW()
              WHERE id = $1::uuid
              RETURNING id
            `,
            [
              parsedId.data,
              input.title,
              input.description,
              input.startDate,
              input.endDate,
              input.status,
              input.assignmentScope,
              input.icon ??
                null,
            ],
          );

        if (
          !result.rows[0]
        ) {
          await client.query(
            "ROLLBACK",
          );

          res.status(404).json({
            success:
              false,

            message:
              "Program not found.",
          });

          return;
        }

        await saveProgramRelations(
          client,
          parsedId.data,
          req.auth!.id,
          {
            ...input,
            representativeIds,
          },
        );

        await client.query(
          "COMMIT",
        );
      } catch (
        error
      ) {
        await client.query(
          "ROLLBACK",
        );

        throw error;
      } finally {
        client.release();
      }

      await recordPartnerActivity({
        eventType:
          "program_updated",

        actorType:
          "admin",

        adminUserId:
          req.auth!.id,

        programId:
          parsedId.data,

        metadata: {
          label:
            input.title,

          status:
            input.status,
        },
      });

      const program =
        await getAdminProgramDetail(
          parsedId.data,
        );

      res.json({
        success:
          true,

        program,
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

router.delete(
  "/:programId",

  writeRateLimit,

  async (
    req,
    res,
    next,
  ) => {
    const parsedId =
      uuidSchema.safeParse(
        req.params.programId,
      );

    if (
      !parsedId.success
    ) {
      res.status(400).json({
        success:
          false,

        message:
          "Invalid program.",
      });

      return;
    }

    try {
      const result =
        await db.query(
          `
            UPDATE partner_programs
            SET
              status = 'archived',
              updated_at = NOW()
            WHERE id = $1::uuid
            RETURNING id, title
          `,
          [
            parsedId.data,
          ],
        );

      if (
        !result.rows[0]
      ) {
        res.status(404).json({
          success:
            false,

          message:
            "Program not found.",
        });

        return;
      }

      await recordPartnerActivity({
        eventType:
          "program_archived",

        actorType:
          "admin",

        adminUserId:
          req.auth!.id,

        programId:
          parsedId.data,

        metadata: {
          label:
            result.rows[0]
              .title,
        },
      });

      res.json({
        success:
          true,
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
