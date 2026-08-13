import {
  createHmac,
} from "node:crypto";

import {
  z,
} from "zod";

import {
  db,
} from "../config/db.js";

import {
  env,
} from "../config/env.js";

import {
  representativeAvatarUrl,
} from "./profile-avatar.service.js";

import {
  calculatePartnerRank,
} from "./partner-performance.service.js";

export const PARTNER_CHAT_ROOM_SLUG =
  "baki-digital-partners";

const PARTNER_CHAT_ROOM_NAME =
  "Baki Digital Partners";

export const CHAT_RETENTION_DAYS =
  7;

export type ChatRole =
  | "representative"
  | "admin";

export type ChatIdentity = {
  id:
    string;

  role:
    ChatRole;

  name:
    string;

  reference:
    string | null;

  publicKey:
    string;

  avatarUrl:
    string |
    null;

  sessionVersion:
    number |
    null;

  performance:
    | {
        verifiedSales: number;
        reports: number;
      }
    | null;
};

export type ChatParticipant = {
  participantKey:
    string;

  name:
    string;

  partnerId:
    string | null;

  role:
    ChatRole;

  avatarUrl:
    string | null;

  performance:
    | {
        rank: "NOOB" | "PRO" | "EXPERT";
        verifiedSales: number;
        reports: number;
      }
    | null;
};

export type PartnerChatMessage = {
  id:
    string;

  clientMessageId:
    string;

  message:
    string | null;

  sender:
    ChatParticipant;

  replyTo:
    | {
        id:
          string;

        message:
          string | null;

        deleted:
          boolean;

        sender:
          ChatParticipant;
      }
    | null;

  editedAt:
    string | null;

  deletedAt:
    string | null;

  createdAt:
    string;

  updatedAt:
    string;
};

const cursorSchema =
  z.object({
    createdAt:
      z.string().datetime({
        offset:
          true,
      }),

    id:
      z.string().uuid(),
  });

function toIso(
  value:
    unknown,
) {
  if (
    value instanceof
    Date
  ) {
    return value.toISOString();
  }

  const date =
    new Date(
      String(
        value,
      ),
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      "Invalid chat timestamp.",
    );
  }

  return date.toISOString();
}

export function createChatPublicKey(
  role:
    ChatRole,

  id:
    string,
) {
  return createHmac(
    "sha256",
    env.JWT_SECRET,
  )
    .update(
      `partner-chat:${role}:${id}`,
      "utf8",
    )
    .digest(
      "hex",
    )
    .slice(
      0,
      40,
    );
}

export function toChatParticipant(
  identity:
    ChatIdentity,
): ChatParticipant {
  return {
    participantKey:
      identity.publicKey,

    name:
      identity.name,

    partnerId:
      identity.role ===
        "representative"
        ? identity.reference
        : null,

    role:
      identity.role,

    avatarUrl:
      identity.avatarUrl,

    performance:
      identity.performance
        ? {
            ...identity.performance,
            rank: calculatePartnerRank(
              identity.performance.verifiedSales,
              identity.performance.reports,
            ),
          }
        : null,
  };
}

function participantFromRow(
  row:
    Record<string, unknown>,

  prefix:
    "sender" |
    "reply_sender",
): ChatParticipant {
  return {
    participantKey:
      String(
        row[`${prefix}_public_key`] ??
          "unknown",
      ),

    name:
      String(
        row[`${prefix}_display_name`] ??
          "Former member",
      ),

    partnerId:
      row[`${prefix}_reference`]
        ? String(
            row[`${prefix}_reference`],
          )
        : null,

    role:
      row[`${prefix}_type`] ===
        "admin"
        ? "admin"
        : "representative",

    avatarUrl:
      representativeAvatarUrl({
        publicId:
          row[`${prefix}_avatar_public_id`] as
            | string
            | null,

        version:
          row[`${prefix}_avatar_version`] as
            | number
            | string
            | null,

        format:
          row[`${prefix}_avatar_format`] as
            | string
            | null,
      }),

    performance:
      row[`${prefix}_type`] === "admin"
        ? null
        : {
            verifiedSales: Number(row[`${prefix}_verified_sales`] ?? 0),
            reports: Number(row[`${prefix}_reports`] ?? 0),
            rank: calculatePartnerRank(
              Number(row[`${prefix}_verified_sales`] ?? 0),
              Number(row[`${prefix}_reports`] ?? 0),
            ),
          },
  };
}

function mapMessageRow(
  row:
    Record<string, unknown>,
): PartnerChatMessage {
  const deletedAt =
    row.deleted_at
      ? toIso(
          row.deleted_at,
        )
      : null;

  const replyDeletedAt =
    row.reply_deleted_at
      ? toIso(
          row.reply_deleted_at,
        )
      : null;

  return {
    id:
      String(
        row.id,
      ),

    clientMessageId:
      String(
        row.client_message_id,
      ),

    message:
      deletedAt
        ? null
        : String(
            row.message,
          ),

    sender:
      participantFromRow(
        row,
        "sender",
      ),

    replyTo:
      row.reply_id
        ? {
            id:
              String(
                row.reply_id,
              ),

            message:
              replyDeletedAt
                ? null
                : String(
                    row.reply_message,
                  ),

            deleted:
              Boolean(
                replyDeletedAt,
              ),

            sender:
              participantFromRow(
                row,
                "reply_sender",
              ),
          }
        : null,

    editedAt:
      row.edited_at
        ? toIso(
            row.edited_at,
          )
        : null,

    deletedAt,

    createdAt:
      toIso(
        row.created_at,
      ),

    updatedAt:
      toIso(
        row.updated_at,
      ),
  };
}

const messageSelect = `
  WITH participant_stats AS (
    SELECT
      representative.id,
      COALESCE(sale_totals.verified_sales, 0)::int AS verified_sales,
      COALESCE(report_totals.reports, 0)::int AS reports
    FROM sales_representatives representative
    LEFT JOIN (
      SELECT representative_id, COUNT(*)::int AS verified_sales
      FROM partner_verified_sales
      WHERE status = 'active'
      GROUP BY representative_id
    ) sale_totals
      ON sale_totals.representative_id = representative.id
    LEFT JOIN (
      SELECT representative_id, COUNT(*)::int AS reports
      FROM representative_reports
      GROUP BY representative_id
    ) report_totals
      ON report_totals.representative_id = representative.id
  )
  SELECT
    message.id,
    message.client_message_id,
    message.message,
    message.sender_type,
    message.sender_public_key,
    COALESCE(
      NULLIF(TRIM(sender_representative.display_name), ''),
      sender_representative.name,
      message.sender_display_name
    ) AS sender_display_name,
    COALESCE(sender_representative.username, message.sender_reference) AS sender_reference,
    sender_representative.avatar_public_id AS sender_avatar_public_id,
    sender_representative.avatar_format AS sender_avatar_format,
    sender_representative.avatar_version AS sender_avatar_version,
    sender_stats.verified_sales AS sender_verified_sales,
    sender_stats.reports AS sender_reports,
    message.edited_at,
    message.deleted_at,
    message.created_at,
    message.updated_at,
    NOW() AS chat_server_time,

    reply.id AS reply_id,
    reply.message AS reply_message,
    reply.sender_type AS reply_sender_type,
    reply.sender_public_key AS reply_sender_public_key,
    COALESCE(
      NULLIF(TRIM(reply_representative.display_name), ''),
      reply_representative.name,
      reply.sender_display_name
    ) AS reply_sender_display_name,
    COALESCE(reply_representative.username, reply.sender_reference) AS reply_sender_reference,
    reply_representative.avatar_public_id AS reply_sender_avatar_public_id,
    reply_representative.avatar_format AS reply_sender_avatar_format,
    reply_representative.avatar_version AS reply_sender_avatar_version,
    reply_stats.verified_sales AS reply_sender_verified_sales,
    reply_stats.reports AS reply_sender_reports,
    reply.deleted_at AS reply_deleted_at

  FROM partner_chat_messages message

  LEFT JOIN partner_chat_messages reply
    ON reply.id = message.reply_to_message_id

  LEFT JOIN sales_representatives sender_representative
    ON sender_representative.id = message.representative_id

  LEFT JOIN sales_representatives reply_representative
    ON reply_representative.id = reply.representative_id

  LEFT JOIN participant_stats sender_stats
    ON sender_stats.id = sender_representative.id

  LEFT JOIN participant_stats reply_stats
    ON reply_stats.id = reply_representative.id
`;

async function getRoomRow() {
  const result =
    await db.query(
      `
        SELECT
          id,
          slug,
          name,
          created_at
        FROM partner_chat_rooms
        WHERE LOWER(slug) = LOWER($1::text)
        LIMIT 1
      `,
      [
        PARTNER_CHAT_ROOM_SLUG,
      ],
    );

  const room =
    result.rows[0];

  if (
    !room
  ) {
    throw new Error(
      "Partner chat room is not initialized. Run migration 011.",
    );
  }

  return room;
}

export function getPartnerChatRoom() {
  return {
    slug:
      PARTNER_CHAT_ROOM_SLUG,

    name:
      PARTNER_CHAT_ROOM_NAME,

    retentionDays:
      CHAT_RETENTION_DAYS,
  };
}

function encodeCursor(
  createdAt:
    unknown,

  id:
    unknown,
) {
  return Buffer.from(
    JSON.stringify({
      createdAt:
        toIso(
          createdAt,
        ),

      id:
        String(
          id,
        ),
    }),
    "utf8",
  ).toString(
    "base64url",
  );
}

export function decodeChatCursor(
  value:
    string | undefined,
) {
  if (
    !value
  ) {
    return null;
  }

  try {
    const parsed =
      cursorSchema.safeParse(
        JSON.parse(
          Buffer.from(
            value,
            "base64url",
          ).toString(
            "utf8",
          ),
        ),
      );

    return parsed.success
      ? parsed.data
      : null;
  } catch {
    return null;
  }
}

export async function getPartnerChatMessages({
  before,
  limit,
}: {
  before:
    ReturnType<
      typeof decodeChatCursor
    >;

  limit:
    number;
}) {
  const result =
    await db.query(
        `
          ${messageSelect}
          WHERE
            message.room_id = (
              SELECT id
              FROM partner_chat_rooms
              WHERE LOWER(slug) = LOWER($1::text)
              LIMIT 1
            )
            AND message.created_at >=
              NOW() - INTERVAL '7 days'
            AND message.created_at <=
              NOW()
            AND (
              $2::timestamptz IS NULL
              OR (
                message.created_at,
                message.id
              ) < (
                $2::timestamptz,
                $3::uuid
              )
            )
          ORDER BY
            message.created_at DESC,
            message.id DESC
          LIMIT $4::integer
        `,
        [
          PARTNER_CHAT_ROOM_SLUG,
          before?.createdAt ??
            null,
          before?.id ??
            null,
          limit +
            1,
        ],
      );

  const serverTime =
    result.rows[0]
      ?.chat_server_time
      ? toIso(
          result.rows[0]
            .chat_server_time,
        )
      : toIso(
          (
            await db.query(
              "SELECT NOW() AS server_time",
            )
          ).rows[0]
            .server_time,
        );

  const hasMore =
    result.rows.length >
    limit;

  const selectedRows =
    result.rows.slice(
      0,
      limit,
    );

  const oldest =
    selectedRows[
      selectedRows.length -
        1
    ];

  return {
    messages:
      selectedRows
        .map(
          mapMessageRow,
        )
        .reverse(),

    nextCursor:
      hasMore &&
      oldest
        ? encodeCursor(
            oldest.created_at,
            oldest.id,
          )
        : null,

    hasMore,

    serverTime:
      serverTime,
  };
}

export async function synchronizePartnerChatMessages(
  since:
    string,
) {
  const result =
    await db.query(
      `
        ${messageSelect}
        WHERE
          message.room_id = (
            SELECT id
            FROM partner_chat_rooms
            WHERE LOWER(slug) = LOWER($1::text)
            LIMIT 1
          )
          AND message.created_at >=
            NOW() - INTERVAL '7 days'
          AND message.updated_at >
            GREATEST(
              $2::timestamptz,
              NOW() - INTERVAL '7 days'
            )
          AND message.updated_at <=
            NOW()
        ORDER BY
          message.updated_at ASC,
          message.id ASC
        LIMIT 501
      `,
      [
        PARTNER_CHAT_ROOM_SLUG,
        since,
      ],
    );

  const serverTime =
    result.rows[0]
      ?.chat_server_time
      ? toIso(
          result.rows[0]
            .chat_server_time,
        )
      : toIso(
          (
            await db.query(
              "SELECT NOW() AS server_time",
            )
          ).rows[0]
            .server_time,
        );

  return {
    messages:
      result.rows
        .slice(
          0,
          500,
        )
        .map(
          mapMessageRow,
        ),

    truncated:
      result.rows.length >
      500,

    serverTime,
  };
}

export async function getPartnerChatUnreadCount(
  identity:
    ChatIdentity,
) {
  const room =
    await getRoomRow();

  /*
    A bind parameter has one PostgreSQL type for the entire statement.
    Select exactly one viewer ID column from the authenticated role so
    $3 is resolved only as UUID, instead of reusing it in two OR branches.
    This column name never comes from request input.
  */
  const viewerIdColumn =
    identity.role ===
    "representative"
      ? "representative_id"
      : "admin_user_id";

  const result =
    await db.query(
      `
        SELECT COUNT(*)::int AS unread_count
        FROM partner_chat_messages message
        LEFT JOIN partner_chat_reads read_state
          ON
            read_state.room_id = message.room_id
            AND read_state.viewer_type = $2::varchar(24)
            AND read_state.${viewerIdColumn} = $3::uuid
        WHERE
          message.room_id = $1::uuid
          AND message.created_at >=
            NOW() - INTERVAL '7 days'
          AND message.deleted_at IS NULL
          AND message.sender_public_key <> $4::varchar(64)
          AND message.created_at >
            COALESCE(
              read_state.last_read_at,
              '-infinity'::timestamptz
            )
      `,
      [
        room.id,
        identity.role,
        identity.id,
        identity.publicKey,
      ],
    );

  return Number(
    result.rows[0]
      ?.unread_count ??
      0,
  );
}

export async function markPartnerChatRead(
  identity:
    ChatIdentity,
) {
  const room =
    await getRoomRow();

  if (
    identity.role ===
    "representative"
  ) {
    const result =
      await db.query(
        `
          INSERT INTO partner_chat_reads (
            room_id,
            viewer_type,
            representative_id,
            last_read_at
          )
          VALUES (
            $1::uuid,
            'representative',
            $2::uuid,
            NOW()
          )
          ON CONFLICT (
            room_id,
            representative_id
          )
          WHERE viewer_type = 'representative'
          DO UPDATE SET
            last_read_at = GREATEST(
              partner_chat_reads.last_read_at,
              NOW()
            ),
            updated_at = NOW()
          RETURNING last_read_at
        `,
        [
          room.id,
          identity.id,
        ],
      );

    return {
      unreadCount:
        0,

      readAt:
        toIso(
          result.rows[0]
            .last_read_at,
        ),
    };
  } else {
    const result =
      await db.query(
        `
        INSERT INTO partner_chat_reads (
          room_id,
          viewer_type,
          admin_user_id,
          last_read_at
        )
        VALUES (
          $1::uuid,
          'admin',
          $2::uuid,
          NOW()
        )
        ON CONFLICT (
          room_id,
          admin_user_id
        )
        WHERE viewer_type = 'admin'
        DO UPDATE SET
          last_read_at = GREATEST(
            partner_chat_reads.last_read_at,
            NOW()
          ),
          updated_at = NOW()
        RETURNING last_read_at
        `,
        [
          room.id,
          identity.id,
        ],
      );

    return {
      unreadCount:
        0,

      readAt:
        toIso(
          result.rows[0]
            .last_read_at,
        ),
    };
  }
}

async function getMessageById(
  roomId:
    string,

  messageId:
    string,
) {
  const result =
    await db.query(
      `
        ${messageSelect}
        WHERE
          message.room_id = $1::uuid
          AND message.id = $2::uuid
          AND message.created_at >=
            NOW() - INTERVAL '7 days'
        LIMIT 1
      `,
      [
        roomId,
        messageId,
      ],
    );

  return result.rows[0]
    ? mapMessageRow(
        result.rows[0],
      )
    : null;
}

export async function createPartnerChatMessage({
  identity,
  clientMessageId,
  message,
  replyToMessageId,
}: {
  identity:
    ChatIdentity;

  clientMessageId:
    string;

  message:
    string;

  replyToMessageId:
    string | null;
}) {
  const room =
    await getRoomRow();

  const insertResult =
    await db.query(
      `
        WITH input AS (
          SELECT
            $1::uuid AS room_id,
            $2::uuid AS client_message_id,
            $3::varchar(24) AS sender_type,
            $4::uuid AS account_id,
            $5::varchar(64) AS sender_public_key,
            $6::varchar(160) AS sender_display_name,
            $7::varchar(32) AS sender_reference,
            $8::text AS message,
            $9::uuid AS reply_to_message_id
        )
        INSERT INTO partner_chat_messages (
          room_id,
          client_message_id,
          sender_type,
          representative_id,
          admin_user_id,
          sender_public_key,
          sender_display_name,
          sender_reference,
          message,
          reply_to_message_id
        )
        SELECT
          input.room_id,
          input.client_message_id,
          input.sender_type,
          CASE
            WHEN input.sender_type = 'representative'
              THEN input.account_id
            ELSE NULL
          END,
          CASE
            WHEN input.sender_type = 'admin'
              THEN input.account_id
            ELSE NULL
          END,
          input.sender_public_key,
          input.sender_display_name,
          input.sender_reference,
          input.message,
          input.reply_to_message_id
        FROM input
        WHERE
          input.reply_to_message_id IS NULL
          OR EXISTS (
            SELECT 1
            FROM partner_chat_messages original
            WHERE
              original.id = input.reply_to_message_id
              AND original.room_id = input.room_id
              AND original.deleted_at IS NULL
              AND original.created_at >=
                NOW() - INTERVAL '7 days'
          )
        ON CONFLICT (
          room_id,
          sender_public_key,
          client_message_id
        )
        DO NOTHING
        RETURNING id
      `,
      [
        room.id,
        clientMessageId,
        identity.role,
        identity.id,
        identity.publicKey,
        identity.name,
        identity.role ===
          "representative"
          ? identity.reference
          : null,
        message,
        replyToMessageId,
      ],
    );

  let messageId =
    insertResult.rows[0]
      ?.id as
      | string
      | undefined;

  if (
    !messageId
  ) {
    const existing =
      await db.query(
        `
          SELECT id
          FROM partner_chat_messages
          WHERE
            room_id = $1::uuid
            AND sender_public_key = $2::varchar(64)
            AND client_message_id = $3::uuid
          LIMIT 1
        `,
        [
          room.id,
          identity.publicKey,
          clientMessageId,
        ],
      );

    messageId =
      existing.rows[0]
        ?.id;
  }

  if (
    !messageId
  ) {
    throw new Error(
      "The original message is no longer available.",
    );
  }

  const created =
    await getMessageById(
      room.id,
      messageId,
    );

  if (
    !created
  ) {
    throw new Error(
      "Unable to load the sent message.",
    );
  }

  return created;
}

export async function editPartnerChatMessage({
  identity,
  messageId,
  message,
}: {
  identity:
    ChatIdentity;

  messageId:
    string;

  message:
    string;
}) {
  const room =
    await getRoomRow();

  const result =
    await db.query(
      `
        UPDATE partner_chat_messages
        SET
          message = $1::text,
          edited_at = NOW(),
          updated_at = NOW()
        WHERE
          id = $2::uuid
          AND room_id = $3::uuid
          AND sender_public_key = $4::varchar(64)
          AND deleted_at IS NULL
          AND created_at >=
            NOW() - INTERVAL '7 days'
        RETURNING id
      `,
      [
        message,
        messageId,
        room.id,
        identity.publicKey,
      ],
    );

  if (
    result.rowCount ===
    0
  ) {
    throw new Error(
      "You can only edit your own available messages.",
    );
  }

  const updated =
    await getMessageById(
      room.id,
      messageId,
    );

  if (
    !updated
  ) {
    throw new Error(
      "Message not found.",
    );
  }

  return updated;
}

export async function deletePartnerChatMessage({
  identity,
  messageId,
}: {
  identity:
    ChatIdentity;

  messageId:
    string;
}) {
  const room =
    await getRoomRow();

  const result =
    await db.query(
      `
        UPDATE partner_chat_messages
        SET
          deleted_at = NOW(),
          deleted_by_type = $1::varchar(24),
          deleted_by_representative_id =
            CASE
              WHEN $1::varchar(24) = 'representative'
                THEN $2::uuid
              ELSE NULL
            END,
          deleted_by_admin_user_id =
            CASE
              WHEN $1::varchar(24) = 'admin'
                THEN $2::uuid
              ELSE NULL
            END,
          updated_at = NOW()
        WHERE
          id = $3::uuid
          AND room_id = $4::uuid
          AND deleted_at IS NULL
          AND created_at >=
            NOW() - INTERVAL '7 days'
          AND (
            $1::varchar(24) = 'admin'
            OR sender_public_key = $5::varchar(64)
          )
        RETURNING id
      `,
      [
        identity.role,
        identity.id,
        messageId,
        room.id,
        identity.publicKey,
      ],
    );

  if (
    result.rowCount ===
    0
  ) {
    throw new Error(
      "You are not allowed to delete this message.",
    );
  }

  const updated =
    await getMessageById(
      room.id,
      messageId,
    );

  if (
    !updated
  ) {
    throw new Error(
      "Message not found.",
    );
  }

  return updated;
}
