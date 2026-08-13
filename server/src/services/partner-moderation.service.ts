import type {
  PoolClient,
  QueryResult,
  QueryResultRow,
} from "pg";

import {
  db,
} from "../config/db.js";

import {
  recordPartnerActivity,
} from "./partner-activity.service.js";

type QueryExecutor = {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<T>>;
};

export type PartnerBanDuration =
  | "1h"
  | "24h"
  | "1w"
  | "30d"
  | "permanent"
  | "custom";

export type ActivePartnerBan = {
  id: string;
  reason: string;
  startedAt: Date;
  bannedUntil: Date | null;
  isPermanent: boolean;
};

export class PartnerModerationError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "PartnerModerationError";
    this.status = status;
    this.code = code;
  }
}

function durationEnd(
  duration: PartnerBanDuration,
  customUntil?: Date | null,
) {
  if (duration === "permanent") {
    return null;
  }

  if (duration === "custom") {
    if (!customUntil || customUntil.getTime() <= Date.now()) {
      throw new PartnerModerationError(
        400,
        "INVALID_BAN_EXPIRY",
        "The custom ban expiry must be in the future.",
      );
    }

    return customUntil;
  }

  const milliseconds: Record<Exclude<PartnerBanDuration, "permanent" | "custom">, number> = {
    "1h": 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "1w": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };

  return new Date(Date.now() + milliseconds[duration]);
}

async function closeExpiredPartnerBans(
  representativeId: string,
  executor: QueryExecutor = db,
) {
  await executor.query(
    `
      UPDATE partner_bans
      SET
        ended_at = banned_until,
        end_reason = 'expired',
        updated_at = NOW()
      WHERE
        representative_id = $1::uuid
        AND ended_at IS NULL
        AND is_permanent = FALSE
        AND banned_until <= NOW()
    `,
    [representativeId],
  );
}

export async function getActivePartnerBan(
  representativeId: string,
  executor: QueryExecutor = db,
): Promise<ActivePartnerBan | null> {
  const result = await executor.query<{
    id: string;
    reason: string;
    started_at: Date;
    banned_until: Date | null;
    is_permanent: boolean;
  }>(
    `
      SELECT
        id,
        reason,
        started_at,
        banned_until,
        is_permanent
      FROM partner_bans
      WHERE
        representative_id = $1::uuid
        AND ended_at IS NULL
        AND (
          is_permanent = TRUE
          OR banned_until > NOW()
        )
      ORDER BY started_at DESC
      LIMIT 1
    `,
    [representativeId],
  );

  const row = result.rows[0];

  return row
    ? {
        id: row.id,
        reason: row.reason,
        startedAt: row.started_at,
        bannedUntil: row.banned_until,
        isPermanent: row.is_permanent,
      }
    : null;
}

export async function getPartnerModerationProfile(
  representativeId: string,
) {
  await closeExpiredPartnerBans(representativeId);

  const [active, historyResult] = await Promise.all([
    getActivePartnerBan(representativeId),
    db.query(
      `
        SELECT
          ban.id,
          ban.reason,
          ban.started_at,
          ban.banned_until,
          ban.is_permanent,
          ban.ended_at,
          ban.end_reason,
          banning_admin.name AS banned_by_name,
          ending_admin.name AS ended_by_name,
          ban.source_chat_report_id
        FROM partner_bans ban
        LEFT JOIN admins banning_admin
          ON banning_admin.id = ban.banned_by_admin_id
        LEFT JOIN admins ending_admin
          ON ending_admin.id = ban.ended_by_admin_id
        WHERE ban.representative_id = $1::uuid
        ORDER BY ban.started_at DESC, ban.id DESC
        LIMIT 100
      `,
      [representativeId],
    ),
  ]);

  return {
    active,
    history: historyResult.rows.map((row) => ({
      id: String(row.id),
      reason: String(row.reason),
      startedAt: row.started_at,
      bannedUntil: row.banned_until ?? null,
      isPermanent: Boolean(row.is_permanent),
      endedAt: row.ended_at ?? null,
      endReason: row.end_reason ?? null,
      bannedByName: row.banned_by_name ?? null,
      endedByName: row.ended_by_name ?? null,
      sourceChatReportId: row.source_chat_report_id ?? null,
    })),
  };
}

export async function banPartner(input: {
  representativeId: string;
  adminId: string;
  duration: PartnerBanDuration;
  reason: string;
  customUntil?: Date | null;
  sourceChatReportId?: string | null;
}) {
  const reason = input.reason.trim();

  if (!reason || reason.length > 500) {
    throw new PartnerModerationError(
      400,
      "BAN_REASON_REQUIRED",
      "A ban reason is required and must be no longer than 500 characters.",
    );
  }

  const bannedUntil = durationEnd(input.duration, input.customUntil);
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const representative = await client.query(
      `
        SELECT id
        FROM sales_representatives
        WHERE id = $1::uuid
        FOR UPDATE
      `,
      [input.representativeId],
    );

    if (!representative.rows[0]) {
      throw new PartnerModerationError(404, "PARTNER_NOT_FOUND", "Partner not found.");
    }

    await closeExpiredPartnerBans(input.representativeId, client as PoolClient);

    const current = await getActivePartnerBan(
      input.representativeId,
      client as PoolClient,
    );

    if (current) {
      throw new PartnerModerationError(
        409,
        "PARTNER_ALREADY_BANNED",
        "This Partner already has an active ban.",
      );
    }

    const inserted = await client.query(
      `
        INSERT INTO partner_bans (
          representative_id,
          banned_by_admin_id,
          source_chat_report_id,
          reason,
          banned_until,
          is_permanent
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3::uuid,
          $4::text,
          $5::timestamptz,
          $6::boolean
        )
        RETURNING id, reason, started_at, banned_until, is_permanent
      `,
      [
        input.representativeId,
        input.adminId,
        input.sourceChatReportId ?? null,
        reason,
        bannedUntil,
        input.duration === "permanent",
      ],
    );

    await client.query("COMMIT");

    const row = inserted.rows[0];

    await recordPartnerActivity({
      eventType: "partner.banned",
      actorType: "admin",
      representativeId: input.representativeId,
      adminUserId: input.adminId,
      metadata: {
        label: input.duration === "permanent" ? "Partner permanently banned" : "Partner temporarily banned",
        reason,
        duration: input.duration,
        bannedUntil,
        sourceChatReportId: input.sourceChatReportId ?? null,
      },
    });

    return {
      id: String(row.id),
      reason: String(row.reason),
      startedAt: row.started_at,
      bannedUntil: row.banned_until ?? null,
      isPermanent: Boolean(row.is_permanent),
    } satisfies ActivePartnerBan;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function unbanPartner(input: {
  representativeId: string;
  adminId: string;
}) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
        SELECT id
        FROM sales_representatives
        WHERE id = $1::uuid
        FOR UPDATE
      `,
      [input.representativeId],
    );

    await closeExpiredPartnerBans(input.representativeId, client as PoolClient);

    const result = await client.query(
      `
        UPDATE partner_bans
        SET
          ended_at = NOW(),
          ended_by_admin_id = $2::uuid,
          end_reason = 'unbanned',
          updated_at = NOW()
        WHERE
          representative_id = $1::uuid
          AND ended_at IS NULL
          AND (is_permanent = TRUE OR banned_until > NOW())
        RETURNING id, reason
      `,
      [input.representativeId, input.adminId],
    );

    if (!result.rows[0]) {
      throw new PartnerModerationError(
        409,
        "PARTNER_NOT_BANNED",
        "This Partner does not have an active ban.",
      );
    }

    await client.query("COMMIT");

    await recordPartnerActivity({
      eventType: "partner.unbanned",
      actorType: "admin",
      representativeId: input.representativeId,
      adminUserId: input.adminId,
      metadata: {
        label: "Partner access restored",
        banId: result.rows[0].id,
      },
    });

    return { id: String(result.rows[0].id) };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
