import {
  db,
} from "../config/db.js";

const CHAT_RETENTION_LOCK_ID =
  6_714_208_119;

const DELETE_BATCH_SIZE =
  5_000;

export async function deleteExpiredPartnerChatMessages() {
  const client =
    await db.connect();

  let lockAcquired =
    false;

  try {
    const lockResult =
      await client.query(
        "SELECT pg_try_advisory_lock($1::bigint) AS locked",
        [
          CHAT_RETENTION_LOCK_ID,
        ],
      );

    lockAcquired =
      Boolean(
        lockResult.rows[0]
          ?.locked,
      );

    if (
      !lockAcquired
    ) {
      return {
        skipped:
          true,

        reason:
          "already_running",

        deletedMessageCount:
          0,
      };
    }

    let deletedMessageCount =
      0;

    while (
      true
    ) {
      const result =
        await client.query(
          `
            WITH expired AS (
              SELECT id
              FROM partner_chat_messages
              WHERE created_at <
                NOW() - INTERVAL '7 days'
              ORDER BY created_at ASC
              LIMIT $1::integer
              FOR UPDATE SKIP LOCKED
            )
            DELETE FROM partner_chat_messages message
            USING expired
            WHERE message.id = expired.id
            RETURNING message.id
          `,
          [
            DELETE_BATCH_SIZE,
          ],
        );

      const deleted =
        result.rowCount ??
        0;

      deletedMessageCount +=
        deleted;

      if (
        deleted <
        DELETE_BATCH_SIZE
      ) {
        break;
      }
    }

    return {
      skipped:
        false,

      deletedMessageCount,
    };
  } finally {
    if (
      lockAcquired
    ) {
      try {
        await client.query(
          "SELECT pg_advisory_unlock($1::bigint)",
          [
            CHAT_RETENTION_LOCK_ID,
          ],
        );
      } catch (
        error
      ) {
        console.error(
          "Unable to release Partner Chat retention lock:",
          error instanceof
            Error
            ? error.message
            : "Unknown lock error.",
        );
      }
    }

    client.release();
  }
}
