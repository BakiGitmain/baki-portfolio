import { createHash } from "node:crypto";

import type { PoolClient } from "pg";

import { db } from "../config/db.js";
import { sendPartnerProgramCompletionEmail } from "./application-email.service.js";
import { recordPartnerActivity } from "./partner-activity.service.js";
import { getPartnerPerformance } from "./partner-performance.service.js";

export type ProgramTargetType =
  | "reports"
  | "lessons"
  | "course_completion"
  | "leads_submitted"
  | "qualified_lead"
  | "confirmed_sale"
  | "partner_referral"
  | "custom_challenge";

export type ProgramSubmissionInput = {
  businessName?: string;
  contactName?: string;
  contactMethod?: string;
  businessType?: string;
  needSummary?: string;
  notes?: string;
  explanation?: string;
  publicUrl?: string;
};

type ProgramRow = Record<string, unknown>;

type ProgramReviewInput = {
  decision: "approve" | "reject";
  rejectionReason?: string;
  saleAmountEtb?: number;
  saleReference?: string;
  saleConfirmed?: boolean;
  customerPaymentCleared?: boolean;
};

type RewardActionInput = {
  action: "approve" | "mark_paid" | "mark_applied";
  note?: string;
  saleReference?: string;
  saleAmountEtb?: number;
};

export class ProgramOperationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

function dateOnly(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizedContact(value: string) {
  return value.trim().toLowerCase().replace(/[\s()+-]/g, "");
}

function contactHash(input: ProgramSubmissionInput) {
  const value =
    input.contactMethod?.trim() ||
    input.publicUrl?.trim() ||
    `${input.businessName ?? ""}|${input.contactName ?? ""}`.trim();

  if (!value || value === "|") return null;
  return createHash("sha256").update(normalizedContact(value)).digest("hex");
}

function effectiveStatus(row: ProgramRow, progressPercent?: number) {
  const stored = String(row.status);
  if (stored === "draft" || stored === "archived") return stored;
  if (stored === "completed" || (progressPercent ?? 0) >= 100) return "completed";

  const today = new Date().toISOString().slice(0, 10);
  const start = dateOnly(row.start_date);
  const end = dateOnly(row.end_date);

  if (today < start) return "upcoming";
  if (today > end) return "expired";
  return "active";
}

function mapReward(row: ProgramRow | null | undefined, program: ProgramRow) {
  const type = String(program.reward_type ?? "none");
  const value = numberOrNull(program.reward_value);
  const scope = program.reward_scope ? String(program.reward_scope) : null;

  if (!row) {
    return {
      id: null,
      type,
      value,
      scope,
      description: String(program.reward_description ?? ""),
      status: "locked",
      saleReference: null,
      saleAmountEtb: null,
      baseCommissionPercent: null,
      effectiveCommissionPercent: null,
      earnedAt: null,
      approvedAt: null,
      paidOrAppliedAt: null,
      adminNote: "",
    };
  }

  return {
    id: row.id,
    type: row.reward_type,
    value: numberOrNull(row.reward_value),
    scope: row.reward_scope ?? null,
    description: String(program.reward_description ?? ""),
    status: row.status,
    saleReference: row.sale_reference ?? null,
    saleAmountEtb: numberOrNull(row.sale_amount_etb),
    baseCommissionPercent: numberOrNull(row.base_commission_percent),
    effectiveCommissionPercent: numberOrNull(row.effective_commission_percent),
    earnedAt: row.earned_at ?? null,
    approvedAt: row.approved_at ?? null,
    paidOrAppliedAt: row.paid_or_applied_at ?? null,
    adminNote: row.admin_note ?? "",
  };
}

function mapProgram(row: ProgramRow, progressPercent = Number(row.progress_percent ?? 0)) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    instructions: row.instructions ?? "",
    startDate: dateOnly(row.start_date),
    endDate: dateOnly(row.end_date),
    status: row.status,
    effectiveStatus: effectiveStatus(row, progressPercent),
    assignmentScope: row.assignment_scope,
    icon: row.icon ?? null,
    participantCount: Number(row.participant_count ?? 0),
    completedCount: Number(row.completed_count ?? 0),
    targetCount: Number(row.target_count ?? 0),
    progressPercent,
    pendingSubmissionCount: Number(row.pending_submission_count ?? 0),
    pendingRewardCount: Number(row.pending_reward_count ?? 0),
    attentionCount: Number(row.attention_count ?? 0),
    reward: mapReward(null, row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const progressValueSql = `
  CASE target.target_type
    WHEN 'reports' THEN (
      SELECT COUNT(*)::int
      FROM representative_reports report
      WHERE
        report.representative_id = participant.representative_id
        AND report.created_at >= program.start_date::timestamp
        AND report.created_at < (program.end_date + 1)::timestamp
    )
    WHEN 'lessons' THEN (
      SELECT COUNT(*)::int
      FROM representative_training_lesson_progress lesson_progress
      WHERE
        lesson_progress.representative_id = participant.representative_id
        AND lesson_progress.completed = TRUE
        AND lesson_progress.completed_at >= program.start_date::timestamp
        AND lesson_progress.completed_at < (program.end_date + 1)::timestamp
    )
    WHEN 'course_completion' THEN (
      SELECT CASE
        WHEN COUNT(lesson.id) = 0 THEN 0
        WHEN COUNT(progress.id) FILTER (WHERE progress.completed = TRUE) = COUNT(lesson.id)
          AND MAX(progress.completed_at) >= program.start_date::timestamp
          AND MAX(progress.completed_at) < (program.end_date + 1)::timestamp
          THEN 1
        ELSE 0
      END::int
      FROM training_lessons lesson
      INNER JOIN training_sections section ON section.id = lesson.section_id
      LEFT JOIN representative_training_lesson_progress progress
        ON progress.lesson_id = lesson.id
        AND progress.representative_id = participant.representative_id
      WHERE section.course_id = target.course_id
    )
    WHEN 'partner_referral' THEN (
      SELECT COUNT(*)::int
      FROM partner_referrals referral
      WHERE
        referral.referring_representative_id = participant.representative_id
        AND referral.status = 'activated'
        AND referral.activated_at >= program.start_date::timestamp
        AND referral.activated_at < (program.end_date + 1)::timestamp
    )
    WHEN 'leads_submitted' THEN (
      SELECT COUNT(*)::int
      FROM partner_program_submissions submission
      WHERE
        submission.program_id = program.id
        AND submission.target_id = target.id
        AND submission.representative_id = participant.representative_id
        AND submission.status = 'approved'
    )
    WHEN 'qualified_lead' THEN (
      SELECT COUNT(*)::int
      FROM partner_program_submissions submission
      WHERE
        submission.program_id = program.id
        AND submission.target_id = target.id
        AND submission.representative_id = participant.representative_id
        AND submission.status = 'approved'
    )
    WHEN 'confirmed_sale' THEN (
      SELECT COUNT(*)::int
      FROM partner_program_submissions submission
      WHERE
        submission.program_id = program.id
        AND submission.target_id = target.id
        AND submission.representative_id = participant.representative_id
        AND submission.status = 'approved'
        AND submission.sale_confirmed = TRUE
        AND submission.customer_payment_cleared = TRUE
    )
    WHEN 'custom_challenge' THEN (
      SELECT COUNT(*)::int
      FROM partner_program_submissions submission
      WHERE
        submission.program_id = program.id
        AND submission.target_id = target.id
        AND submission.representative_id = participant.representative_id
        AND submission.status = 'approved'
    )
    ELSE 0
  END
`;

function groupBy<T extends Record<string, unknown>>(rows: T[], key: keyof T) {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const value = String(row[key]);
    grouped.set(value, [...(grouped.get(value) ?? []), row]);
  }
  return grouped;
}

async function listRepresentativeProgramsInternal(
  representativeId: string,
  options?: { activeOnly?: boolean },
) {
  const activeOnly = options?.activeOnly ?? false;

  const programResult = await db.query(
    `
      SELECT
        program.*,
        1::int AS participant_count
      FROM partner_programs program
      WHERE
        program.deleted_at IS NULL
        AND program.status NOT IN ('draft', 'archived')
        AND ($2::boolean = FALSE OR CURRENT_DATE BETWEEN program.start_date AND program.end_date)
        AND (
          program.assignment_scope = 'everyone'
          OR EXISTS (
            SELECT 1
            FROM partner_program_assignments assignment
            WHERE assignment.program_id = program.id
              AND assignment.representative_id = $1::uuid
          )
        )
      ORDER BY
        CASE
          WHEN CURRENT_DATE BETWEEN program.start_date AND program.end_date THEN 0
          WHEN CURRENT_DATE < program.start_date THEN 1
          ELSE 2
        END,
        program.end_date ASC,
        program.start_date ASC
    `,
    [representativeId, activeOnly],
  );

  if (!programResult.rowCount) return [];

  const programIds = programResult.rows.map((row) => row.id);

  const [targetResult, submissionResult, rewardResult] = await Promise.all([
    db.query(
      `
        WITH participant AS (
          SELECT
            program.id AS program_id,
            $1::uuid AS representative_id
          FROM partner_programs program
          WHERE program.id = ANY($2::uuid[])
        )
        SELECT
          program.id AS program_id,
          target.id,
          target.target_type,
          target.target_value,
          target.course_id,
          target.sort_order,
          course.title_en AS course_title_en,
          course.title_am AS course_title_am,
          (${progressValueSql})::int AS actual_value
        FROM partner_programs program
        INNER JOIN participant ON participant.program_id = program.id
        INNER JOIN partner_program_targets target ON target.program_id = program.id
        LEFT JOIN training_courses course ON course.id = target.course_id
        ORDER BY program.id, target.sort_order, target.created_at
      `,
      [representativeId, programIds],
    ),
    db.query(
      `
        SELECT *
        FROM partner_program_submissions
        WHERE representative_id = $1::uuid
          AND program_id = ANY($2::uuid[])
        ORDER BY created_at DESC
      `,
      [representativeId, programIds],
    ),
    db.query(
      `
        SELECT *
        FROM partner_program_rewards
        WHERE representative_id = $1::uuid
          AND program_id = ANY($2::uuid[])
      `,
      [representativeId, programIds],
    ),
  ]);

  const targetsByProgram = groupBy(targetResult.rows, "program_id");
  const submissionsByProgram = groupBy(submissionResult.rows, "program_id");
  const rewardsByProgram = new Map(
    rewardResult.rows.map((row) => [String(row.program_id), row]),
  );

  return programResult.rows.map((program) => {
    const targets = (targetsByProgram.get(String(program.id)) ?? []).map((target) => ({
      id: target.id,
      targetType: target.target_type as ProgramTargetType,
      targetValue: Number(target.target_value),
      actualValue: Number(target.actual_value),
      courseId: target.course_id ?? null,
      courseTitleEn: target.course_title_en ?? null,
      courseTitleAm: target.course_title_am ?? null,
      sortOrder: Number(target.sort_order),
    }));

    const progressPercent = targets.length
      ? Math.round(
          targets.reduce(
            (sum, target) =>
              sum + Math.min(100, (100 * target.actualValue) / Math.max(1, target.targetValue)),
            0,
          ) / targets.length,
        )
      : 0;

    const submissions = (submissionsByProgram.get(String(program.id)) ?? []).map(
      (submission) => ({
        id: submission.id,
        targetId: submission.target_id,
        submissionType: submission.submission_type,
        status: submission.status,
        businessName: submission.business_name ?? null,
        contactName: submission.contact_name ?? null,
        contactMethod: submission.contact_method ?? null,
        businessType: submission.business_type ?? null,
        needSummary: submission.need_summary ?? null,
        notes: submission.notes ?? "",
        explanation: submission.explanation ?? "",
        publicUrl: submission.public_url ?? null,
        saleAmountEtb: numberOrNull(submission.sale_amount_etb),
        rejectionReason: submission.rejection_reason ?? null,
        createdAt: submission.created_at,
        reviewedAt: submission.reviewed_at ?? null,
      }),
    );

    return {
      ...mapProgram(
        {
          ...program,
          target_count: targets.length,
          progress_percent: progressPercent,
        },
        progressPercent,
      ),
      targets,
      submissions,
      reward: mapReward(rewardsByProgram.get(String(program.id)), program),
      referralPath: `/hire?ref=${encodeURIComponent(String(program.partner_id ?? ""))}`,
    };
  });
}

export async function listRepresentativePrograms(
  representativeId: string,
  options?: { activeOnly?: boolean },
) {
  await materializeOpenProgramAssignmentsForRepresentative(representativeId);
  await syncRepresentativeProgramCompletions(representativeId);

  const programs = await listRepresentativeProgramsInternal(representativeId, options);
  const representative = await db.query(
    `SELECT username FROM sales_representatives WHERE id = $1::uuid LIMIT 1`,
    [representativeId],
  );
  const partnerId = String(representative.rows[0]?.username ?? "");

  return programs.map((program) => ({
    ...program,
    referralPath: `/hire?ref=${encodeURIComponent(partnerId)}`,
  }));
}

export async function listAdminPrograms() {
  const result = await db.query(
    `
      WITH participants AS (
        SELECT program.id AS program_id, representative.id AS representative_id
        FROM partner_programs program
        INNER JOIN sales_representatives representative ON representative.is_active = TRUE
        WHERE
          program.deleted_at IS NULL
          AND (
            program.assignment_scope = 'everyone'
            OR EXISTS (
              SELECT 1 FROM partner_program_assignments assignment
              WHERE assignment.program_id = program.id
                AND assignment.representative_id = representative.id
            )
          )
      ),
      target_progress AS (
        SELECT
          program.id AS program_id,
          participant.representative_id,
          LEAST(100.0, 100.0 * (${progressValueSql}) / NULLIF(target.target_value, 0)) AS progress_percent
        FROM partner_programs program
        INNER JOIN participants participant ON participant.program_id = program.id
        INNER JOIN partner_program_targets target ON target.program_id = program.id
      ),
      participant_progress AS (
        SELECT program_id, representative_id, ROUND(AVG(progress_percent))::int AS progress_percent
        FROM target_progress
        GROUP BY program_id, representative_id
      ),
      program_progress AS (
        SELECT
          program_id,
          ROUND(AVG(progress_percent))::int AS progress_percent,
          COUNT(*) FILTER (WHERE progress_percent >= 100)::int AS completed_count
        FROM participant_progress
        GROUP BY program_id
      )
      SELECT
        program.*,
        (SELECT COUNT(*)::int FROM participants p WHERE p.program_id = program.id) AS participant_count,
        (SELECT COUNT(*)::int FROM partner_program_targets t WHERE t.program_id = program.id) AS target_count,
        COALESCE(progress.progress_percent, 0)::int AS progress_percent,
        COALESCE(progress.completed_count, 0)::int AS completed_count,
        (SELECT COUNT(*)::int FROM partner_program_submissions s WHERE s.program_id = program.id AND s.status = 'pending') AS pending_submission_count,
        (SELECT COUNT(*)::int FROM partner_program_rewards r WHERE r.program_id = program.id AND r.status = 'earned') AS pending_reward_count,
        (
          (SELECT COUNT(*) FROM partner_program_submissions s WHERE s.program_id = program.id AND s.status = 'pending')
          + (SELECT COUNT(*) FROM partner_program_rewards r WHERE r.program_id = program.id AND r.status = 'earned')
        )::int AS attention_count
      FROM partner_programs program
      LEFT JOIN program_progress progress ON progress.program_id = program.id
      WHERE program.deleted_at IS NULL
      ORDER BY
        CASE
          WHEN program.status NOT IN ('draft', 'archived') AND CURRENT_DATE BETWEEN program.start_date AND program.end_date THEN 0
          WHEN CURRENT_DATE < program.start_date THEN 1
          WHEN CURRENT_DATE > program.end_date THEN 2
          ELSE 3
        END,
        program.updated_at DESC
    `,
  );

  return result.rows.map((row) => mapProgram(row));
}

export async function getAdminProgramDetail(programId: string) {
  const programResult = await db.query(
    `SELECT * FROM partner_programs WHERE id = $1::uuid AND deleted_at IS NULL LIMIT 1`,
    [programId],
  );
  const program = programResult.rows[0];
  if (!program) return null;

  const participantResult = await db.query(
    `
      SELECT
        representative.id AS representative_id,
        COALESCE(NULLIF(TRIM(representative.display_name), ''), representative.name) AS name,
        representative.username
      FROM sales_representatives representative
      WHERE representative.is_active = TRUE
        AND (
          $2::varchar = 'everyone'
          OR EXISTS (
            SELECT 1 FROM partner_program_assignments assignment
            WHERE assignment.program_id = $1::uuid
              AND assignment.representative_id = representative.id
          )
        )
      ORDER BY name, representative.username
    `,
    [programId, program.assignment_scope],
  );

  const participantIds = participantResult.rows.map((row) => row.representative_id);
  const [targetResult, submissionResult, rewardResult] = await Promise.all([
    db.query(
      `
        SELECT
          target.id,
          target.target_type,
          target.target_value,
          target.course_id,
          target.sort_order,
          course.title_en AS course_title_en,
          course.title_am AS course_title_am
        FROM partner_program_targets target
        LEFT JOIN training_courses course ON course.id = target.course_id
        WHERE target.program_id = $1::uuid
        ORDER BY target.sort_order, target.created_at
      `,
      [programId],
    ),
    db.query(
      `
        SELECT
          submission.*,
          COALESCE(NULLIF(TRIM(representative.display_name), ''), representative.name) AS representative_name,
          representative.username AS partner_id
        FROM partner_program_submissions submission
        INNER JOIN sales_representatives representative ON representative.id = submission.representative_id
        WHERE submission.program_id = $1::uuid
        ORDER BY CASE submission.status WHEN 'pending' THEN 0 ELSE 1 END, submission.created_at DESC
      `,
      [programId],
    ),
    db.query(
      `
        SELECT
          reward.*,
          COALESCE(NULLIF(TRIM(representative.display_name), ''), representative.name) AS representative_name,
          representative.username AS partner_id
        FROM partner_program_rewards reward
        INNER JOIN sales_representatives representative ON representative.id = reward.representative_id
        WHERE reward.program_id = $1::uuid
        ORDER BY CASE reward.status WHEN 'earned' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, reward.earned_at DESC
      `,
      [programId],
    ),
  ]);

  const ranking = await Promise.all(
    participantResult.rows.map(async (participant) => {
      const programs = await listRepresentativeProgramsInternal(participant.representative_id, { activeOnly: false });
      const detail = programs.find((item) => item.id === programId);
      return {
        representativeId: participant.representative_id,
        name: participant.name,
        partnerId: participant.username,
        progressPercent: detail?.progressPercent ?? 0,
        targets: detail?.targets.map((target) => ({
          targetId: target.id,
          targetType: target.targetType,
          targetValue: target.targetValue,
          actualValue: target.actualValue,
          courseId: target.courseId,
        })) ?? [],
      };
    }),
  );

  ranking.sort((a, b) => b.progressPercent - a.progressPercent || a.name.localeCompare(b.name));
  const progressPercent = ranking.length
    ? Math.round(ranking.reduce((sum, item) => sum + item.progressPercent, 0) / ranking.length)
    : 0;
  const completedCount = ranking.filter((item) => item.progressPercent >= 100).length;
  const pendingSubmissionCount = submissionResult.rows.filter((row) => row.status === "pending").length;
  const pendingRewardCount = rewardResult.rows.filter((row) => row.status === "earned").length;

  return {
    ...mapProgram(
      {
        ...program,
        participant_count: participantIds.length,
        target_count: targetResult.rowCount ?? 0,
        progress_percent: progressPercent,
        completed_count: completedCount,
        pending_submission_count: pendingSubmissionCount,
        pending_reward_count: pendingRewardCount,
        attention_count: pendingSubmissionCount + pendingRewardCount,
      },
      progressPercent,
    ),
    targets: targetResult.rows.map((target) => ({
      id: target.id,
      targetType: target.target_type as ProgramTargetType,
      targetValue: Number(target.target_value),
      courseId: target.course_id ?? null,
      courseTitleEn: target.course_title_en ?? null,
      courseTitleAm: target.course_title_am ?? null,
      sortOrder: Number(target.sort_order),
    })),
    representativeIds: participantIds,
    ranking,
    submissions: submissionResult.rows.map((submission) => ({
      id: submission.id,
      representativeId: submission.representative_id,
      representativeName: submission.representative_name,
      partnerId: submission.partner_id,
      targetId: submission.target_id,
      submissionType: submission.submission_type,
      status: submission.status,
      businessName: submission.business_name ?? null,
      contactName: submission.contact_name ?? null,
      contactMethod: submission.contact_method ?? null,
      businessType: submission.business_type ?? null,
      needSummary: submission.need_summary ?? null,
      notes: submission.notes ?? "",
      explanation: submission.explanation ?? "",
      publicUrl: submission.public_url ?? null,
      saleAmountEtb: numberOrNull(submission.sale_amount_etb),
      saleReference: submission.sale_reference ?? null,
      saleConfirmed: Boolean(submission.sale_confirmed),
      customerPaymentCleared: Boolean(submission.customer_payment_cleared),
      rejectionReason: submission.rejection_reason ?? null,
      createdAt: submission.created_at,
      reviewedAt: submission.reviewed_at ?? null,
    })),
    rewards: rewardResult.rows.map((reward) => ({
      ...mapReward(reward, program),
      representativeId: reward.representative_id,
      representativeName: reward.representative_name,
      partnerId: reward.partner_id,
    })),
  };
}

export async function getAdminProgramAttentionCount() {
  const result = await db.query(
    `
      SELECT (
        (
          SELECT COUNT(*)
          FROM partner_program_submissions submission
          INNER JOIN partner_programs program ON program.id = submission.program_id
          WHERE submission.status = 'pending' AND program.deleted_at IS NULL
        )
        + (
          SELECT COUNT(*)
          FROM partner_program_rewards reward
          INNER JOIN partner_programs program ON program.id = reward.program_id
          WHERE reward.status = 'earned' AND program.deleted_at IS NULL
        )
      )::int AS count
    `,
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function getRepresentativeProgramNotificationCount(representativeId: string) {
  const result = await db.query(
    `
      SELECT COUNT(*)::int AS count
      FROM partner_program_notifications notification
      INNER JOIN partner_programs program ON program.id = notification.program_id
      WHERE
        notification.representative_id = $1::uuid
        AND notification.read_at IS NULL
        AND program.deleted_at IS NULL
    `,
    [representativeId],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function markRepresentativeProgramNotificationsRead(representativeId: string) {
  const result = await db.query(
    `
      UPDATE partner_program_notifications
      SET read_at = NOW()
      WHERE representative_id = $1::uuid AND read_at IS NULL
    `,
    [representativeId],
  );
  return result.rowCount ?? 0;
}

async function insertProgramNotification(
  client: PoolClient | typeof db,
  input: {
    representativeId: string;
    programId: string;
    eventType: "assigned" | "submission_approved" | "submission_rejected" | "completed" | "reward_approved";
    messageEn: string;
    messageAm: string;
    dedupeKey: string;
  },
) {
  await client.query(
    `
      INSERT INTO partner_program_notifications (
        representative_id, program_id, event_type, message_en, message_am, dedupe_key
      )
      SELECT $1::uuid, program.id, $3::varchar, $4::varchar, $5::varchar, $6::varchar
      FROM partner_programs program
      WHERE program.id = $2::uuid AND program.deleted_at IS NULL
      ON CONFLICT (dedupe_key) DO NOTHING
    `,
    [
      input.representativeId,
      input.programId,
      input.eventType,
      input.messageEn,
      input.messageAm,
      input.dedupeKey,
    ],
  );
}

export async function notifyCurrentProgramAssignments(programId: string, adminId: string) {
  const result = await db.query(
    `
      WITH program AS (
        SELECT id, title
        FROM partner_programs
        WHERE id = $1::uuid
          AND deleted_at IS NULL
          AND status NOT IN ('draft', 'archived')
      ), assigned AS (
        SELECT assignment.representative_id, program.id AS program_id, program.title
        FROM program
        INNER JOIN partner_program_assignments assignment ON assignment.program_id = program.id
      )
      INSERT INTO partner_program_notifications (
        representative_id, program_id, event_type, message_en, message_am, dedupe_key
      )
      SELECT
        representative_id,
        program_id,
        'assigned',
        'A new Program was assigned to you: ' || title,
        'አዲስ ፕሮግራም ተመድቦልዎታል፦ ' || title,
        'assigned:' || program_id::text || ':' || representative_id::text
      FROM assigned
      ON CONFLICT (dedupe_key) DO NOTHING
      RETURNING representative_id
    `,
    [programId],
  );

  if (result.rowCount) {
    await recordPartnerActivity({
      eventType: "program.assigned",
      actorType: "admin",
      adminUserId: adminId,
      programId,
      metadata: { count: result.rowCount },
    });
  }

  return result.rowCount ?? 0;
}

export async function materializeOpenProgramAssignmentsForRepresentative(representativeId: string) {
  const result = await db.query(
    `
      WITH inserted AS (
        INSERT INTO partner_program_assignments (
          program_id, representative_id, assigned_by_admin_id
        )
        SELECT program.id, $1::uuid, program.created_by_admin_id
        FROM partner_programs program
        WHERE program.assignment_scope = 'everyone'
          AND program.deleted_at IS NULL
          AND program.status NOT IN ('draft', 'archived')
          AND program.end_date >= CURRENT_DATE
        ON CONFLICT (program_id, representative_id) DO NOTHING
        RETURNING program_id
      )
      INSERT INTO partner_program_notifications (
        representative_id, program_id, event_type, message_en, message_am, dedupe_key
      )
      SELECT
        $1::uuid,
        inserted.program_id,
        'assigned',
        'A new Program was assigned to you: ' || program.title,
        'አዲስ ፕሮግራም ተመድቦልዎታል፦ ' || program.title,
        'assigned:' || inserted.program_id::text || ':' || $1::uuid::text
      FROM inserted
      INNER JOIN partner_programs program ON program.id = inserted.program_id
      ON CONFLICT (dedupe_key) DO NOTHING
    `,
    [representativeId],
  );
  return result.rowCount ?? 0;
}

function completionTargetLabel(targetType: ProgramTargetType) {
  switch (targetType) {
    case "reports":
      return "submitted reports";
    case "lessons":
      return "completed lessons";
    case "course_completion":
      return "completed course";
    case "leads_submitted":
      return "submitted leads";
    case "qualified_lead":
      return "qualified leads";
    case "confirmed_sale":
      return "confirmed sales";
    case "partner_referral":
      return "partner referrals";
    case "custom_challenge":
      return "challenge goals";
  }
}

async function sendProgramCompletionEmailIfNeeded(
  representativeId: string,
  program: {
    id: unknown;
    title: unknown;
    targets?: Array<{
      targetType: ProgramTargetType;
      targetValue: number;
      actualValue: number;
    }>;
  },
) {
  try {
    await db.query(
      `
        INSERT INTO partner_program_completion_emails (
          program_id,
          representative_id
        )
        SELECT program.id, $2::uuid
        FROM partner_programs program
        WHERE program.id = $1::uuid AND program.deleted_at IS NULL
        ON CONFLICT (program_id, representative_id) DO NOTHING
      `,
      [program.id, representativeId],
    );

    const claimed = await db.query(
      `
        UPDATE partner_program_completion_emails
        SET
          claimed_at = NOW(),
          last_attempt_at = NOW(),
          attempts = attempts + 1,
          updated_at = NOW()
        WHERE
          program_id = $1::uuid
          AND representative_id = $2::uuid
          AND sent_at IS NULL
          AND (
            claimed_at IS NULL
            OR claimed_at < NOW() - INTERVAL '10 minutes'
          )
          AND (
            last_attempt_at IS NULL
            OR last_attempt_at < NOW() - INTERVAL '1 minute'
          )
        RETURNING program_id, representative_id
      `,
      [program.id, representativeId],
    );

    if (!claimed.rowCount) return false;

    const detailResult = await db.query(
      `
        SELECT
          representative.email,
          COALESCE(
            NULLIF(TRIM(representative.display_name), ''),
            representative.name
          ) AS representative_name,
          program.reward_type,
          program.reward_value,
          program.reward_description
        FROM partner_programs program
        INNER JOIN sales_representatives representative
          ON representative.id = $2::uuid
        WHERE program.id = $1::uuid
          AND program.deleted_at IS NULL
        LIMIT 1
      `,
      [program.id, representativeId],
    );

    const detail = detailResult.rows[0];
    if (!detail?.email) {
      await db.query(
        `
          UPDATE partner_program_completion_emails
          SET claimed_at = NULL, updated_at = NOW()
          WHERE program_id = $1::uuid AND representative_id = $2::uuid
        `,
        [program.id, representativeId],
      );
      return false;
    }

    const rewardType = String(detail.reward_type ?? "none");
    const rewardValue = numberOrNull(detail.reward_value);
    const configuredDescription = String(detail.reward_description ?? "").trim();
    const reward = rewardType === "none"
      ? null
      : {
          description:
            configuredDescription ||
            (rewardType === "bonus_commission"
              ? `+${rewardValue ?? 0}% bonus commission`
              : `ETB ${rewardValue ?? 0} reward`),
          label: "Earned",
        };

    const targets = program.targets ?? [];
    const goalSummary = targets.length
      ? targets
          .map((target) =>
            `${Math.min(target.actualValue, target.targetValue)} / ${target.targetValue} ${completionTargetLabel(target.targetType)}`,
          )
          .join("\n")
      : "All Program goals completed";

    const sent = await sendPartnerProgramCompletionEmail({
      representativeId,
      email: String(detail.email),
      fullName: String(detail.representative_name),
      programId: String(program.id),
      programTitle: String(program.title),
      goalSummary,
      reward,
    });

    if (!sent) {
      await db.query(
        `
          UPDATE partner_program_completion_emails
          SET claimed_at = NULL, updated_at = NOW()
          WHERE program_id = $1::uuid AND representative_id = $2::uuid AND sent_at IS NULL
        `,
        [program.id, representativeId],
      );
      return false;
    }

    await db.query(
      `
        UPDATE partner_program_completion_emails
        SET
          sent_at = COALESCE(sent_at, NOW()),
          claimed_at = NULL,
          updated_at = NOW()
        WHERE program_id = $1::uuid AND representative_id = $2::uuid
      `,
      [program.id, representativeId],
    );

    await recordPartnerActivity({
      eventType: "program.completion_email_sent",
      actorType: "system",
      representativeId,
      programId: String(program.id),
      metadata: { label: String(program.title) },
    });

    return true;
  } catch (error) {
    console.error(
      "Program completion email failed:",
      error instanceof Error ? error.message : "Unknown Program completion email error.",
    );
    return false;
  }
}

export async function syncRepresentativeProgramCompletions(representativeId: string) {
  const programs = await listRepresentativeProgramsInternal(representativeId, { activeOnly: false });

  for (const program of programs) {
    if (program.progressPercent < 100) {
      await db.query(
        `
          DELETE FROM partner_program_rewards
          WHERE program_id = $1::uuid
            AND representative_id = $2::uuid
            AND status = 'earned'
        `,
        [program.id, representativeId],
      );
      continue;
    }

    const associated = await db.query(
      `
        SELECT id
        FROM partner_program_submissions
        WHERE program_id = $1::uuid
          AND representative_id = $2::uuid
          AND status = 'approved'
        ORDER BY
          CASE submission_type WHEN 'confirmed_sale' THEN 0 ELSE 1 END,
          reviewed_at DESC NULLS LAST,
          created_at DESC
        LIMIT 1
      `,
      [program.id, representativeId],
    );

    const inserted = await db.query(
      `
        INSERT INTO partner_program_rewards (
          program_id,
          representative_id,
          reward_type,
          reward_value,
          reward_scope,
          associated_submission_id
        )
        SELECT
          program.id,
          $2::uuid,
          program.reward_type,
          program.reward_value,
          program.reward_scope,
          $3::uuid
        FROM partner_programs program
        WHERE program.id = $1::uuid
          AND program.deleted_at IS NULL
        ON CONFLICT (program_id, representative_id) DO NOTHING
        RETURNING id
      `,
      [program.id, representativeId, associated.rows[0]?.id ?? null],
    );

    if (inserted.rowCount) {
      await insertProgramNotification(db, {
        representativeId,
        programId: String(program.id),
        eventType: "completed",
        messageEn: `Program completed: ${program.title}`,
        messageAm: `ፕሮግራሙ ተጠናቋል፦ ${program.title}`,
        dedupeKey: `completed:${String(program.id)}:${representativeId}`,
      });

      await recordPartnerActivity({
        eventType: "program.completed",
        actorType: "system",
        representativeId,
        programId: String(program.id),
        metadata: { label: program.title },
      });
    }

    await sendProgramCompletionEmailIfNeeded(representativeId, program);
  }
}

export async function createProgramSubmission(
  representativeId: string,
  programId: string,
  targetId: string,
  input: ProgramSubmissionInput,
) {
  const targetResult = await db.query(
    `
      SELECT target.target_type, target.target_value, program.title
      FROM partner_program_targets target
      INNER JOIN partner_programs program ON program.id = target.program_id
      WHERE target.id = $1::uuid
        AND program.id = $2::uuid
        AND program.deleted_at IS NULL
        AND program.status NOT IN ('draft', 'archived', 'completed')
        AND CURRENT_DATE BETWEEN program.start_date AND program.end_date
        AND (
          program.assignment_scope = 'everyone'
          OR EXISTS (
            SELECT 1 FROM partner_program_assignments assignment
            WHERE assignment.program_id = program.id
              AND assignment.representative_id = $3::uuid
          )
        )
      LIMIT 1
    `,
    [targetId, programId, representativeId],
  );

  const target = targetResult.rows[0];
  if (!target) {
    throw new ProgramOperationError("PROGRAM_NOT_ELIGIBLE", "This Program is not open for your account.", 403);
  }

  const submissionType = String(target.target_type) as ProgramTargetType;
  if (![
    "leads_submitted",
    "qualified_lead",
    "confirmed_sale",
    "custom_challenge",
  ].includes(submissionType)) {
    throw new ProgramOperationError("AUTOMATIC_GOAL", "This goal is tracked automatically.");
  }

  const completedResult = await db.query(
    `
      SELECT COUNT(*)::int AS count
      FROM partner_program_submissions submission
      WHERE submission.target_id = $1::uuid
        AND submission.representative_id = $2::uuid
        AND submission.status = 'approved'
    `,
    [targetId, representativeId],
  );
  if (Number(completedResult.rows[0]?.count ?? 0) >= Number(target.target_value)) {
    throw new ProgramOperationError("GOAL_ALREADY_COMPLETE", "This goal is already complete.", 409);
  }

  if (submissionType !== "custom_challenge") {
    if (!input.businessName?.trim() || !input.contactMethod?.trim() || !input.needSummary?.trim()) {
      throw new ProgramOperationError(
        "SUBMISSION_DETAILS_REQUIRED",
        "Add the business, contact method, and what the customer needs.",
      );
    }
  } else if (!input.explanation?.trim()) {
    throw new ProgramOperationError("EXPLANATION_REQUIRED", "Add a short explanation of what you completed.");
  }

  const automatic = submissionType === "leads_submitted";
  const hash = contactHash(input);

  try {
    const result = await db.query(
      `
        INSERT INTO partner_program_submissions (
          program_id,
          target_id,
          representative_id,
          submission_type,
          status,
          business_name,
          contact_name,
          contact_method,
          business_type,
          need_summary,
          notes,
          explanation,
          public_url,
          normalized_contact_hash,
          reviewed_at
        ) VALUES (
          $1::uuid, $2::uuid, $3::uuid, $4::varchar, $5::varchar,
          $6::varchar, $7::varchar, $8::varchar, $9::varchar, $10::varchar,
          $11::text, $12::text, $13::text, $14::char(64),
          CASE WHEN $5::varchar = 'approved' THEN NOW() ELSE NULL END
        )
        RETURNING *
      `,
      [
        programId,
        targetId,
        representativeId,
        submissionType,
        automatic ? "approved" : "pending",
        input.businessName?.trim() || null,
        input.contactName?.trim() || null,
        input.contactMethod?.trim() || null,
        input.businessType?.trim() || null,
        input.needSummary?.trim() || null,
        input.notes?.trim() || "",
        input.explanation?.trim() || "",
        input.publicUrl?.trim() || null,
        hash,
      ],
    );

    const submission = result.rows[0];
    await recordPartnerActivity({
      eventType: "program.submission_created",
      actorType: "representative",
      representativeId,
      programId,
      metadata: { submissionId: submission.id, type: submissionType, label: target.title },
    });

    if (automatic) await syncRepresentativeProgramCompletions(representativeId);
    return submission;
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new ProgramOperationError(
        "DUPLICATE_SUBMISSION",
        "This contact or proof was already submitted for the same challenge.",
        409,
      );
    }
    throw error;
  }
}

export async function reviewProgramSubmission(
  adminId: string,
  submissionId: string,
  input: ProgramReviewInput,
) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const currentResult = await client.query(
      `
        SELECT submission.*, program.title
        FROM partner_program_submissions submission
        INNER JOIN partner_programs program ON program.id = submission.program_id
        WHERE submission.id = $1::uuid
          AND program.deleted_at IS NULL
        FOR UPDATE
      `,
      [submissionId],
    );
    const current = currentResult.rows[0];
    if (!current) throw new ProgramOperationError("SUBMISSION_NOT_FOUND", "Submission not found.", 404);
    if (current.status !== "pending") {
      throw new ProgramOperationError("SUBMISSION_ALREADY_REVIEWED", "This submission has already been reviewed.", 409);
    }

    if (input.decision === "reject" && !input.rejectionReason?.trim()) {
      throw new ProgramOperationError("REJECTION_REASON_REQUIRED", "Add a reason before rejecting the submission.");
    }

    if (input.decision === "approve" && current.submission_type === "confirmed_sale") {
      if (
        input.saleConfirmed !== true ||
        input.customerPaymentCleared !== true ||
        !input.saleReference?.trim() ||
        !input.saleAmountEtb ||
        input.saleAmountEtb < 35_000
      ) {
        throw new ProgramOperationError(
          "SALE_CONFIRMATION_REQUIRED",
          "Confirm the sale, cleared customer payment, qualifying amount, and sale reference.",
        );
      }
    }

    if (input.decision === "approve") {
      const completedResult = await client.query(
        `
          SELECT
            target.target_value,
            COUNT(other.id) FILTER (WHERE other.status = 'approved')::int AS approved_count
          FROM partner_program_targets target
          LEFT JOIN partner_program_submissions other
            ON other.target_id = target.id
            AND other.representative_id = $2::uuid
          WHERE target.id = $1::uuid
          GROUP BY target.target_value
        `,
        [current.target_id, current.representative_id],
      );
      const completion = completedResult.rows[0];
      if (completion && Number(completion.approved_count) >= Number(completion.target_value)) {
        throw new ProgramOperationError(
          "GOAL_ALREADY_COMPLETE",
          "This partner already completed the goal. Reject or leave this extra submission unchanged.",
          409,
        );
      }
    }

    const performanceBefore =
      input.decision === "approve" && current.submission_type === "confirmed_sale"
        ? await getPartnerPerformance(current.representative_id, client)
        : null;

    const status = input.decision === "approve" ? "approved" : "rejected";
    const updateResult = await client.query(
      `
        UPDATE partner_program_submissions
        SET
          status = $2::varchar,
          rejection_reason = $3::text,
          sale_amount_etb = $4::numeric,
          sale_reference = $5::varchar,
          sale_confirmed = $6::boolean,
          customer_payment_cleared = $7::boolean,
          reviewed_by_admin_id = $8::uuid,
          reviewed_at = NOW(),
          updated_at = NOW()
        WHERE id = $1::uuid
        RETURNING *
      `,
      [
        submissionId,
        status,
        status === "rejected" ? input.rejectionReason?.trim() : null,
        status === "approved" && current.submission_type === "confirmed_sale" ? input.saleAmountEtb : null,
        status === "approved" && current.submission_type === "confirmed_sale" ? input.saleReference?.trim() : null,
        status === "approved" && current.submission_type === "confirmed_sale",
        status === "approved" && current.submission_type === "confirmed_sale",
        adminId,
      ],
    );

    const verifiedSaleResult =
      status === "approved" && current.submission_type === "confirmed_sale"
        ? await client.query(
            `
              INSERT INTO partner_verified_sales (
                representative_id,
                added_by_admin_id,
                source_program_submission_id,
                reference,
                note
              )
              VALUES (
                $1::uuid,
                $2::uuid,
                $3::uuid,
                NULLIF(TRIM($4::varchar), ''),
                $5::text
              )
              ON CONFLICT DO NOTHING
              RETURNING id
            `,
            [
              current.representative_id,
              adminId,
              submissionId,
              input.saleReference ?? "",
              `Verified through Program: ${current.title}`,
            ],
          )
        : null;

    const performanceAfter = performanceBefore
      ? await getPartnerPerformance(current.representative_id, client)
      : null;

    await insertProgramNotification(client, {
      representativeId: current.representative_id,
      programId: current.program_id,
      eventType: status === "approved" ? "submission_approved" : "submission_rejected",
      messageEn:
        status === "approved"
          ? `Your submission for ${current.title} was approved.`
          : `Your submission for ${current.title} was rejected.`,
      messageAm:
        status === "approved"
          ? `ለ${current.title} ያቀረቡት መረጃ ጸድቋል።`
          : `ለ${current.title} ያቀረቡት መረጃ ውድቅ ተደርጓል።`,
      dedupeKey: `submission:${status}:${submissionId}`,
    });

    await client.query("COMMIT");

    await recordPartnerActivity({
      eventType: status === "approved" ? "program.submission_approved" : "program.submission_rejected",
      actorType: "admin",
      representativeId: current.representative_id,
      adminUserId: adminId,
      programId: current.program_id,
      metadata: { submissionId, label: current.title },
    });

    if (verifiedSaleResult?.rowCount && performanceAfter) {
      await recordPartnerActivity({
        eventType: "partner.sale_added",
        actorType: "admin",
        representativeId: current.representative_id,
        adminUserId: adminId,
        programId: current.program_id,
        metadata: {
          label: "Verified sale added from Program approval",
          saleId: verifiedSaleResult.rows[0]?.id,
          submissionId,
          reference: input.saleReference?.trim() || null,
        },
      });

      if (performanceBefore && performanceBefore.rank !== performanceAfter.rank) {
        await recordPartnerActivity({
          eventType: "partner.rank_changed_due_to_metrics",
          actorType: "admin",
          representativeId: current.representative_id,
          adminUserId: adminId,
          programId: current.program_id,
          metadata: {
            label: `${performanceBefore.rank} → ${performanceAfter.rank}`,
            previousRank: performanceBefore.rank,
            rank: performanceAfter.rank,
            verifiedSales: performanceAfter.verifiedSales,
            reports: performanceAfter.reports,
          },
        });
      }
    }

    if (status === "approved") await syncRepresentativeProgramCompletions(current.representative_id);
    return updateResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function baseCommissionPercent(saleAmountEtb: number) {
  if (saleAmountEtb < 35_000) return null;
  return saleAmountEtb <= 50_000 ? 20 : 25;
}

export async function updateProgramReward(
  adminId: string,
  rewardId: string,
  input: RewardActionInput,
) {
  const currentResult = await db.query(
    `
      SELECT reward.*, program.title
      FROM partner_program_rewards reward
      INNER JOIN partner_programs program ON program.id = reward.program_id
      WHERE reward.id = $1::uuid
        AND program.deleted_at IS NULL
      LIMIT 1
    `,
    [rewardId],
  );
  const current = currentResult.rows[0];
  if (!current) throw new ProgramOperationError("REWARD_NOT_FOUND", "Reward not found.", 404);

  if (input.action === "approve") {
    if (current.status !== "earned") {
      throw new ProgramOperationError("REWARD_TRANSITION_INVALID", "Only an earned reward can be approved.", 409);
    }
    const result = await db.query(
      `
        UPDATE partner_program_rewards
        SET status = 'approved', approved_at = NOW(), approved_by_admin_id = $2::uuid,
            admin_note = $3::text, updated_at = NOW()
        WHERE id = $1::uuid
        RETURNING *
      `,
      [rewardId, adminId, input.note?.trim() || ""],
    );
    await insertProgramNotification(db, {
      representativeId: current.representative_id,
      programId: current.program_id,
      eventType: "reward_approved",
      messageEn: `Your reward for ${current.title} was approved.`,
      messageAm: `ለ${current.title} ያገኙት ሽልማት ጸድቋል።`,
      dedupeKey: `reward:approved:${rewardId}`,
    });
    await recordPartnerActivity({
      eventType: "program.reward_approved",
      actorType: "admin",
      representativeId: current.representative_id,
      adminUserId: adminId,
      programId: current.program_id,
      metadata: { rewardId, label: current.title },
    });
    return result.rows[0];
  }

  if (current.status !== "approved") {
    throw new ProgramOperationError("REWARD_TRANSITION_INVALID", "Approve the reward before completing it.", 409);
  }

  if (input.action === "mark_paid") {
    if (current.reward_type !== "fixed_etb") {
      throw new ProgramOperationError("REWARD_ACTION_INVALID", "Only a fixed ETB bonus can be marked paid.");
    }
    const result = await db.query(
      `
        UPDATE partner_program_rewards
        SET status = 'paid', paid_or_applied_at = NOW(), completed_by_admin_id = $2::uuid,
            admin_note = $3::text, updated_at = NOW()
        WHERE id = $1::uuid
        RETURNING *
      `,
      [rewardId, adminId, input.note?.trim() || current.admin_note || ""],
    );
    return result.rows[0];
  }

  if (current.reward_type === "fixed_etb") {
    throw new ProgramOperationError("REWARD_ACTION_INVALID", "A fixed ETB bonus must be marked paid.");
  }

  if (current.reward_type === "bonus_commission") {
    const saleAmount = Number(input.saleAmountEtb ?? 0);
    const base = baseCommissionPercent(saleAmount);
    if (!base || !input.saleReference?.trim()) {
      throw new ProgramOperationError(
        "QUALIFYING_SALE_REQUIRED",
        "Add a unique sale reference and a qualifying sale amount of at least ETB 35,000.",
      );
    }
    const normalizedReference = input.saleReference.trim().toLowerCase();
    const effective = base + Number(current.reward_value);
    try {
      const result = await db.query(
        `
          UPDATE partner_program_rewards
          SET
            status = 'applied',
            sale_reference = $2::varchar,
            sale_reference_normalized = $3::varchar,
            sale_amount_etb = $4::numeric,
            base_commission_percent = $5::numeric,
            effective_commission_percent = $6::numeric,
            paid_or_applied_at = NOW(),
            completed_by_admin_id = $7::uuid,
            admin_note = $8::text,
            updated_at = NOW()
          WHERE id = $1::uuid
          RETURNING *
        `,
        [
          rewardId,
          input.saleReference.trim(),
          normalizedReference,
          saleAmount,
          base,
          effective,
          adminId,
          input.note?.trim() || current.admin_note || "",
        ],
      );
      return result.rows[0];
    } catch (error) {
      if ((error as { code?: string }).code === "23505") {
        throw new ProgramOperationError(
          "REWARD_STACKING_BLOCKED",
          "Another commission reward is already applied to this sale. Choose one reward only.",
          409,
        );
      }
      throw error;
    }
  }

  const result = await db.query(
    `
      UPDATE partner_program_rewards
      SET status = 'applied', paid_or_applied_at = NOW(), completed_by_admin_id = $2::uuid,
          admin_note = $3::text, updated_at = NOW()
      WHERE id = $1::uuid
      RETURNING *
    `,
    [rewardId, adminId, input.note?.trim() || current.admin_note || ""],
  );
  return result.rows[0];
}
