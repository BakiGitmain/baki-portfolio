import { Router, type Response } from "express";
import type { PoolClient } from "pg";
import { z } from "zod";

import { db } from "../config/db.js";
import { requireAdmin } from "../middleware/auth.middleware.js";
import { rateLimit } from "../middleware/rate-limit.middleware.js";
import { recordPartnerActivity } from "../services/partner-activity.service.js";
import {
  getAdminProgramAttentionCount,
  getAdminProgramDetail,
  listAdminPrograms,
  notifyCurrentProgramAssignments,
  ProgramOperationError,
  reviewProgramSubmission,
  updateProgramReward,
} from "../services/partner-program.service.js";

const router = Router();
const writeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
const uuidSchema = z.string().uuid();

const targetTypeSchema = z.enum([
  "reports",
  "lessons",
  "course_completion",
  "leads_submitted",
  "qualified_lead",
  "confirmed_sale",
  "partner_referral",
  "custom_challenge",
]);

const targetSchema = z
  .object({
    id: z.string().uuid().optional(),
    targetType: targetTypeSchema,
    targetValue: z.number().int().min(1).max(100000),
    courseId: z.string().uuid().nullable().optional(),
  })
  .strict()
  .superRefine((target, context) => {
    if (target.targetType === "course_completion" && !target.courseId) {
      context.addIssue({ code: "custom", path: ["courseId"], message: "Choose a course." });
    }
    if (target.targetType !== "course_completion" && target.courseId) {
      context.addIssue({
        code: "custom",
        path: ["courseId"],
        message: "Only a course-completion goal can reference a course.",
      });
    }
  });

const rewardSchema = z
  .object({
    type: z.enum(["bonus_commission", "fixed_etb", "none"]),
    value: z.number().positive().max(10_000_000).nullable().optional(),
    scope: z.enum(["next_qualifying_sale", "challenge_sale"]).nullable().optional(),
    description: z.string().trim().max(1000).default(""),
  })
  .strict()
  .superRefine((reward, context) => {
    if (reward.type === "bonus_commission") {
      if (!reward.value || reward.value > 100) {
        context.addIssue({ code: "custom", path: ["value"], message: "Enter percentage points from 0.01 to 100." });
      }
      if (!reward.scope) {
        context.addIssue({ code: "custom", path: ["scope"], message: "Choose which sale receives the bonus." });
      }
    } else if (reward.type === "fixed_etb" && !reward.value) {
      context.addIssue({ code: "custom", path: ["value"], message: "Enter the fixed ETB bonus." });
    }
  });

const programInputSchema = z
  .object({
    title: z.string().trim().min(1).max(220),
    description: z.string().trim().max(20000).default(""),
    instructions: z.string().trim().max(20000).default(""),
    startDate: z.string().date(),
    endDate: z.string().date(),
    status: z.enum(["draft", "scheduled", "active", "completed", "archived"]),
    assignmentScope: z.enum(["everyone", "selected"]),
    representativeIds: z.array(z.string().uuid()).max(1000).default([]),
    icon: z
      .enum([
        "target",
        "growth",
        "training",
        "reports",
        "star",
        "calendar",
        "lead",
        "sale",
        "referral",
        "custom",
      ])
      .nullable()
      .optional(),
    targets: z.array(targetSchema).min(1).max(20),
    reward: rewardSchema,
  })
  .strict()
  .superRefine((input, context) => {
    if (input.endDate < input.startDate) {
      context.addIssue({ code: "custom", path: ["endDate"], message: "The end date must be on or after the start date." });
    }
    if (input.assignmentScope === "selected" && input.representativeIds.length === 0) {
      context.addIssue({ code: "custom", path: ["representativeIds"], message: "Choose at least one partner." });
    }
    const keys = input.targets.map((target) => `${target.targetType}:${target.courseId ?? ""}`);
    if (new Set(keys).size !== keys.length) {
      context.addIssue({ code: "custom", path: ["targets"], message: "Each goal must be unique." });
    }
  });

const reviewSchema = z
  .object({
    decision: z.enum(["approve", "reject"]),
    rejectionReason: z.string().trim().max(5000).optional(),
    saleAmountEtb: z.number().positive().max(1_000_000_000).optional(),
    saleReference: z.string().trim().max(120).optional(),
    saleConfirmed: z.boolean().optional(),
    customerPaymentCleared: z.boolean().optional(),
  })
  .strict();

const rewardActionSchema = z
  .object({
    action: z.enum(["approve", "mark_paid", "mark_applied"]),
    note: z.string().trim().max(5000).optional(),
    saleReference: z.string().trim().max(120).optional(),
    saleAmountEtb: z.number().positive().max(1_000_000_000).optional(),
  })
  .strict();

router.use(requireAdmin);

function invalidProgram(res: Response) {
  return res.status(400).json({
    success: false,
    message: {
      en: "Check the Program, goal, audience, and reward, then try again.",
      am: "የፕሮግራሙን፣ የግቡን፣ የተመዳቢዎቹን እና የሽልማቱን መረጃ አረጋግጠው እንደገና ይሞክሩ።",
    },
  });
}

function operationError(res: Response, error: unknown) {
  if (!(error instanceof ProgramOperationError)) return false;
  res.status(error.status).json({ success: false, code: error.code, message: { en: error.message, am: error.message } });
  return true;
}

async function validateReferences(representativeIds: string[], courseIds: string[]) {
  const [representatives, courses] = await Promise.all([
    representativeIds.length
      ? db.query(`SELECT id FROM sales_representatives WHERE is_active = TRUE AND id = ANY($1::uuid[])`, [representativeIds])
      : Promise.resolve({ rowCount: 0 }),
    courseIds.length
      ? db.query(`SELECT id FROM training_courses WHERE id = ANY($1::uuid[])`, [courseIds])
      : Promise.resolve({ rowCount: 0 }),
  ]);
  return Number(representatives.rowCount ?? 0) === representativeIds.length && Number(courses.rowCount ?? 0) === courseIds.length;
}

async function saveProgramRelations(
  client: PoolClient,
  programId: string,
  adminId: string,
  input: z.infer<typeof programInputSchema>,
) {
  await client.query(`DELETE FROM partner_program_targets WHERE program_id = $1::uuid`, [programId]);

  for (const [index, target] of input.targets.entries()) {
    await client.query(
      `
        INSERT INTO partner_program_targets (
          program_id, target_type, target_value, course_id, sort_order
        ) VALUES ($1::uuid, $2::varchar, $3::int, $4::uuid, $5::int)
      `,
      [programId, target.targetType, target.targetValue, target.courseId ?? null, index],
    );
  }

  await client.query(`DELETE FROM partner_program_assignments WHERE program_id = $1::uuid`, [programId]);

  if (input.assignmentScope === "selected") {
    await client.query(
      `
        INSERT INTO partner_program_assignments (
          program_id, representative_id, assigned_by_admin_id
        )
        SELECT $1::uuid, representative_id, $2::uuid
        FROM UNNEST($3::uuid[]) AS representative_id
      `,
      [programId, adminId, input.representativeIds],
    );
  } else {
    await client.query(
      `
        INSERT INTO partner_program_assignments (
          program_id, representative_id, assigned_by_admin_id
        )
        SELECT $1::uuid, representative.id, $2::uuid
        FROM sales_representatives representative
        WHERE representative.is_active = TRUE
      `,
      [programId, adminId],
    );
  }
}

router.get("/", async (_req, res, next) => {
  try {
    res.json({ success: true, programs: await listAdminPrograms() });
  } catch (error) {
    next(error);
  }
});

router.get("/attention-count", async (_req, res, next) => {
  try {
    res.json({ success: true, count: await getAdminProgramAttentionCount() });
  } catch (error) {
    next(error);
  }
});

router.get("/options", async (_req, res, next) => {
  try {
    const [representativeResult, courseResult] = await Promise.all([
      db.query(`
        SELECT id, COALESCE(NULLIF(TRIM(display_name), ''), name) AS name, username
        FROM sales_representatives WHERE is_active = TRUE ORDER BY name, username
      `),
      db.query(`SELECT id, title_en, title_am, status FROM training_courses ORDER BY sort_order, created_at`),
    ]);
    res.json({
      success: true,
      representatives: representativeResult.rows.map((row) => ({ id: row.id, name: row.name, partnerId: row.username })),
      courses: courseResult.rows.map((row) => ({ id: row.id, titleEn: row.title_en, titleAm: row.title_am, status: row.status })),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", writeRateLimit, async (req, res, next) => {
  const parsed = programInputSchema.safeParse(req.body);
  if (!parsed.success) return void invalidProgram(res);

  const input = parsed.data;
  const representativeIds = input.assignmentScope === "selected" ? [...new Set(input.representativeIds)] : [];
  const courseIds = [...new Set(input.targets.flatMap((target) => (target.courseId ? [target.courseId] : [])))];

  try {
    if (!(await validateReferences(representativeIds, courseIds))) return void invalidProgram(res);
    const client = await db.connect();
    let programId = "";
    try {
      await client.query("BEGIN");
      const result = await client.query(
        `
          INSERT INTO partner_programs (
            title, description, instructions, start_date, end_date, status,
            assignment_scope, icon, reward_type, reward_value, reward_scope,
            reward_description, created_by_admin_id
          ) VALUES (
            $1::varchar, $2::text, $3::text, $4::date, $5::date, $6::varchar,
            $7::varchar, $8::varchar, $9::varchar, $10::numeric, $11::varchar,
            $12::text, $13::uuid
          ) RETURNING id
        `,
        [
          input.title,
          input.description,
          input.instructions,
          input.startDate,
          input.endDate,
          input.status,
          input.assignmentScope,
          input.icon ?? null,
          input.reward.type,
          input.reward.type === "none" ? null : input.reward.value ?? null,
          input.reward.type === "bonus_commission" ? input.reward.scope ?? null : null,
          input.reward.description,
          req.auth!.id,
        ],
      );
      programId = result.rows[0].id;
      await saveProgramRelations(client, programId, req.auth!.id, { ...input, representativeIds });
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    await notifyCurrentProgramAssignments(programId, req.auth!.id);
    await recordPartnerActivity({
      eventType: "program_created",
      actorType: "admin",
      adminUserId: req.auth!.id,
      programId,
      metadata: { label: input.title },
    });
    res.status(201).json({ success: true, program: await getAdminProgramDetail(programId) });
  } catch (error) {
    next(error);
  }
});

router.post("/submissions/:submissionId/review", writeRateLimit, async (req, res, next) => {
  const parsedId = uuidSchema.safeParse(req.params.submissionId);
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsedId.success || !parsed.success) return void invalidProgram(res);
  try {
    const submission = await reviewProgramSubmission(req.auth!.id, parsedId.data, parsed.data);
    res.json({ success: true, submission });
  } catch (error) {
    if (!operationError(res, error)) next(error);
  }
});

router.patch("/rewards/:rewardId", writeRateLimit, async (req, res, next) => {
  const parsedId = uuidSchema.safeParse(req.params.rewardId);
  const parsed = rewardActionSchema.safeParse(req.body);
  if (!parsedId.success || !parsed.success) return void invalidProgram(res);
  try {
    const reward = await updateProgramReward(req.auth!.id, parsedId.data, parsed.data);
    res.json({ success: true, reward });
  } catch (error) {
    if (!operationError(res, error)) next(error);
  }
});

router.get("/:programId", async (req, res, next) => {
  const parsedId = uuidSchema.safeParse(req.params.programId);
  if (!parsedId.success) return void res.status(400).json({ success: false, message: "Invalid Program." });
  try {
    const program = await getAdminProgramDetail(parsedId.data);
    if (!program) return void res.status(404).json({ success: false, message: "Program not found." });
    res.json({ success: true, program });
  } catch (error) {
    next(error);
  }
});

router.patch("/:programId", writeRateLimit, async (req, res, next) => {
  const parsedId = uuidSchema.safeParse(req.params.programId);
  const parsed = programInputSchema.safeParse(req.body);
  if (!parsedId.success || !parsed.success) return void invalidProgram(res);

  const input = parsed.data;
  const representativeIds = input.assignmentScope === "selected" ? [...new Set(input.representativeIds)] : [];
  const courseIds = [...new Set(input.targets.flatMap((target) => (target.courseId ? [target.courseId] : [])))];

  try {
    if (!(await validateReferences(representativeIds, courseIds))) return void invalidProgram(res);
    const activity = await db.query(
      `
        SELECT EXISTS (
          SELECT 1 FROM partner_program_submissions WHERE program_id = $1::uuid
          UNION ALL
          SELECT 1 FROM partner_program_rewards WHERE program_id = $1::uuid
        ) AS has_activity
      `,
      [parsedId.data],
    );
    if (activity.rows[0]?.has_activity) {
      return void res.status(409).json({
        success: false,
        code: "PROGRAM_HAS_ACTIVITY",
        message: "This Program already has submissions or rewards, so its rules can no longer be changed.",
      });
    }

    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        `
          UPDATE partner_programs SET
            title = $2::varchar, description = $3::text, instructions = $4::text,
            start_date = $5::date, end_date = $6::date, status = $7::varchar,
            assignment_scope = $8::varchar, icon = $9::varchar,
            reward_type = $10::varchar, reward_value = $11::numeric,
            reward_scope = $12::varchar, reward_description = $13::text,
            updated_at = NOW()
          WHERE id = $1::uuid AND deleted_at IS NULL RETURNING id
        `,
        [
          parsedId.data,
          input.title,
          input.description,
          input.instructions,
          input.startDate,
          input.endDate,
          input.status,
          input.assignmentScope,
          input.icon ?? null,
          input.reward.type,
          input.reward.type === "none" ? null : input.reward.value ?? null,
          input.reward.type === "bonus_commission" ? input.reward.scope ?? null : null,
          input.reward.description,
        ],
      );
      if (!result.rowCount) throw new ProgramOperationError("PROGRAM_NOT_FOUND", "Program not found.", 404);
      await saveProgramRelations(client, parsedId.data, req.auth!.id, { ...input, representativeIds });
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    await notifyCurrentProgramAssignments(parsedId.data, req.auth!.id);
    await recordPartnerActivity({
      eventType: "program_updated",
      actorType: "admin",
      adminUserId: req.auth!.id,
      programId: parsedId.data,
      metadata: { label: input.title, status: input.status },
    });
    res.json({ success: true, program: await getAdminProgramDetail(parsedId.data) });
  } catch (error) {
    if (!operationError(res, error)) next(error);
  }
});

router.delete("/:programId", writeRateLimit, async (req, res, next) => {
  const parsedId = uuidSchema.safeParse(req.params.programId);
  if (!parsedId.success) return void res.status(400).json({ success: false, message: "Invalid Program." });
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
        UPDATE partner_programs
        SET
          status = 'archived',
          deleted_at = NOW(),
          deleted_by_admin_id = $2::uuid,
          updated_at = NOW()
        WHERE id = $1::uuid AND deleted_at IS NULL
        RETURNING title
      `,
      [parsedId.data, req.auth!.id],
    );

    if (!result.rowCount) {
      await client.query("ROLLBACK");
      res.status(404).json({ success: false, message: "Program not found or already deleted." });
      return;
    }

    await client.query(
      `
        UPDATE partner_program_notifications
        SET read_at = COALESCE(read_at, NOW())
        WHERE program_id = $1::uuid
      `,
      [parsedId.data],
    );

    await client.query("COMMIT");

    await recordPartnerActivity({
      eventType: "program.deleted",
      actorType: "admin",
      adminUserId: req.auth!.id,
      programId: parsedId.data,
      metadata: {
        label: result.rows[0].title,
        deletionMode: "soft",
      },
    });
    res.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    next(error);
  } finally {
    client.release();
  }
});

export default router;
