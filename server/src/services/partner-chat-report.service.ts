import {
  db,
} from "../config/db.js";

import {
  calculatePartnerRank,
} from "./partner-performance.service.js";

import {
  representativeAvatarUrl,
} from "./profile-avatar.service.js";

import {
  canRepresentativeReportMessage,
  isPostgresUniqueViolation,
} from "./moderation-policy.js";

export type PartnerChatReportReason =
  | "spam"
  | "harassment"
  | "scam"
  | "inappropriate"
  | "threats"
  | "other";

export type PartnerChatReportStatus =
  | "pending"
  | "resolved"
  | "dismissed";

export class PartnerChatReportError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "PartnerChatReportError";
    this.status = status;
    this.code = code;
  }
}

export async function createPartnerChatReport(input: {
  reporterRepresentativeId: string;
  messageId: string;
  reason: PartnerChatReportReason;
  note?: string;
}) {
  const note = input.note?.trim() ?? "";

  const messageResult = await db.query(
    `
      SELECT
        message.id,
        message.message,
        message.created_at,
        message.sender_type,
        message.representative_id,
        message.admin_user_id,
        COALESCE(
          NULLIF(TRIM(reported_rep.display_name), ''),
          reported_rep.name,
          reported_admin.name,
          message.sender_display_name
        ) AS reported_name,
        COALESCE(reported_rep.username, message.sender_reference) AS reported_reference,
        CASE
          WHEN reply.deleted_at IS NOT NULL THEN '[Deleted message]'
          ELSE LEFT(reply.message, 1000)
        END AS reply_context
      FROM partner_chat_messages message
      INNER JOIN partner_chat_rooms room
        ON room.id = message.room_id
      LEFT JOIN partner_chat_messages reply
        ON reply.id = message.reply_to_message_id
      LEFT JOIN sales_representatives reported_rep
        ON reported_rep.id = message.representative_id
      LEFT JOIN admins reported_admin
        ON reported_admin.id = message.admin_user_id
      WHERE
        message.id = $1::uuid
        AND room.slug = 'baki-digital-partners'
        AND message.deleted_at IS NULL
        AND message.created_at >= NOW() - INTERVAL '7 days'
      LIMIT 1
    `,
    [input.messageId],
  );

  const message = messageResult.rows[0];

  if (!message) {
    throw new PartnerChatReportError(
      404,
      "CHAT_MESSAGE_NOT_REPORTABLE",
      "This message is no longer available to report.",
    );
  }

  if (!canRepresentativeReportMessage({
    reporterRepresentativeId: input.reporterRepresentativeId,
    senderType: message.sender_type,
    senderRepresentativeId: message.representative_id ?? null,
  })) {
    throw new PartnerChatReportError(
      400,
      "CANNOT_REPORT_OWN_MESSAGE",
      "You cannot report your own message.",
    );
  }

  try {
    const result = await db.query(
      `
        INSERT INTO partner_chat_reports (
          message_id,
          reporter_representative_id,
          reported_sender_type,
          reported_representative_id,
          reported_admin_user_id,
          reported_name_snapshot,
          reported_reference_snapshot,
          message_snapshot,
          message_sent_at,
          reply_context_snapshot,
          reason,
          note
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3::varchar,
          $4::uuid,
          $5::uuid,
          $6::varchar,
          $7::varchar,
          $8::text,
          $9::timestamptz,
          $10::text,
          $11::varchar,
          $12::text
        )
        RETURNING id, created_at
      `,
      [
        message.id,
        input.reporterRepresentativeId,
        message.sender_type,
        message.representative_id ?? null,
        message.admin_user_id ?? null,
        message.reported_name,
        message.reported_reference ?? null,
        message.message,
        message.created_at,
        message.reply_context ?? null,
        input.reason,
        note,
      ],
    );

    return {
      id: String(result.rows[0].id),
      createdAt: result.rows[0].created_at,
    };
  } catch (error) {
    if (isPostgresUniqueViolation(error)) {
      throw new PartnerChatReportError(
        409,
        "CHAT_REPORT_ALREADY_EXISTS",
        "You have already reported this message.",
      );
    }

    throw error;
  }
}

const adminReportSelect = `
  SELECT
    report.id,
    report.message_id,
    report.reported_sender_type,
    report.reported_representative_id,
    report.reported_admin_user_id,
    report.reported_name_snapshot,
    report.reported_reference_snapshot,
    report.message_snapshot,
    report.message_sent_at,
    report.reply_context_snapshot,
    report.reason,
    report.note,
    report.status,
    report.reviewed_at,
    report.resolution_note,
    report.action_summary,
    report.created_at,
    report.updated_at,
    COALESCE(
      NULLIF(TRIM(reported_rep.display_name), ''),
      reported_rep.name,
      reported_admin.name,
      report.reported_name_snapshot
    ) AS current_reported_name,
    COALESCE(reported_rep.username, report.reported_reference_snapshot) AS current_reported_reference,
    reported_rep.avatar_public_id,
    reported_rep.avatar_format,
    reported_rep.avatar_version,
    (
      SELECT COUNT(*)::int
      FROM partner_verified_sales sale
      WHERE
        sale.representative_id = report.reported_representative_id
        AND sale.status = 'active'
    ) AS verified_sales,
    (
      SELECT COUNT(*)::int
      FROM representative_reports partner_report
      WHERE partner_report.representative_id = report.reported_representative_id
    ) AS reports,
    reporter.id AS reporter_id,
    COALESCE(
      NULLIF(TRIM(reporter.display_name), ''),
      reporter.name
    ) AS reporter_name,
    reporter.username AS reporter_reference,
    reviewing_admin.name AS reviewed_by_name
  FROM partner_chat_reports report
  INNER JOIN sales_representatives reporter
    ON reporter.id = report.reporter_representative_id
  LEFT JOIN sales_representatives reported_rep
    ON reported_rep.id = report.reported_representative_id
  LEFT JOIN admins reported_admin
    ON reported_admin.id = report.reported_admin_user_id
  LEFT JOIN admins reviewing_admin
    ON reviewing_admin.id = report.reviewed_by_admin_id
`;

function mapAdminReport(row: Record<string, unknown>) {
  const isRepresentative = row.reported_sender_type === "representative";
  const verifiedSales = Number(row.verified_sales ?? 0);
  const reports = Number(row.reports ?? 0);

  return {
    id: String(row.id),
    messageId: row.message_id ? String(row.message_id) : null,
    reported: {
      role: isRepresentative ? "representative" as const : "admin" as const,
      representativeId: row.reported_representative_id
        ? String(row.reported_representative_id)
        : null,
      name: String(row.current_reported_name),
      partnerId: row.current_reported_reference
        ? String(row.current_reported_reference)
        : null,
      avatarUrl: isRepresentative
        ? representativeAvatarUrl({
            publicId: row.avatar_public_id as string | null,
            version: row.avatar_version as string | number | null,
            format: row.avatar_format as string | null,
          })
        : null,
      performance: isRepresentative
        ? {
            verifiedSales,
            reports,
            rank: calculatePartnerRank(verifiedSales, reports),
          }
        : null,
    },
    reporter: {
      id: String(row.reporter_id),
      name: String(row.reporter_name),
      partnerId: String(row.reporter_reference),
    },
    evidence: {
      message: String(row.message_snapshot),
      sentAt: row.message_sent_at,
      replyContext: row.reply_context_snapshot
        ? String(row.reply_context_snapshot)
        : null,
      reportedNameSnapshot: String(row.reported_name_snapshot),
      reportedPartnerIdSnapshot: row.reported_reference_snapshot
        ? String(row.reported_reference_snapshot)
        : null,
    },
    reason: String(row.reason) as PartnerChatReportReason,
    note: String(row.note ?? ""),
    status: String(row.status) as PartnerChatReportStatus,
    reviewedAt: row.reviewed_at ?? null,
    reviewedByName: row.reviewed_by_name ?? null,
    resolutionNote: String(row.resolution_note ?? ""),
    actionSummary: String(row.action_summary ?? ""),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAdminPartnerChatReports(
  status: PartnerChatReportStatus,
) {
  const result = await db.query(
    `
      ${adminReportSelect}
      WHERE report.status = $1::varchar
      ORDER BY report.created_at DESC, report.id DESC
      LIMIT 250
    `,
    [status],
  );

  return result.rows.map(mapAdminReport);
}

export async function getAdminPartnerChatReport(reportId: string) {
  const result = await db.query(
    `
      ${adminReportSelect}
      WHERE report.id = $1::uuid
      LIMIT 1
    `,
    [reportId],
  );

  return result.rows[0] ? mapAdminReport(result.rows[0]) : null;
}

export async function getPendingPartnerChatReportCount() {
  const result = await db.query(
    `SELECT COUNT(*)::int AS count FROM partner_chat_reports WHERE status = 'pending'`,
  );

  return Number(result.rows[0]?.count ?? 0);
}

export async function reviewPartnerChatReport(input: {
  reportId: string;
  adminId: string;
  status: Exclude<PartnerChatReportStatus, "pending">;
  resolutionNote?: string;
  actionSummary?: string;
}) {
  const result = await db.query(
    `
      UPDATE partner_chat_reports
      SET
        status = $2::varchar,
        reviewed_by_admin_id = $3::uuid,
        reviewed_at = NOW(),
        resolution_note = TRIM($4::text),
        action_summary = TRIM($5::text),
        updated_at = NOW()
      WHERE
        id = $1::uuid
        AND status = 'pending'
      RETURNING id
    `,
    [
      input.reportId,
      input.status,
      input.adminId,
      input.resolutionNote ?? "",
      input.actionSummary ?? "",
    ],
  );

  if (!result.rows[0]) {
    throw new PartnerChatReportError(
      409,
      "CHAT_REPORT_NOT_PENDING",
      "This Chat report has already been reviewed or no longer exists.",
    );
  }

  return getAdminPartnerChatReport(input.reportId);
}
