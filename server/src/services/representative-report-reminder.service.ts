import {
  db,
} from "../config/db.js";

import {
  sendRepresentativeReportReminderEmail,
} from "./application-email.service.js";

const REMINDER_JOB_LOCK_ID =
  4_815_162_342;

const MAX_REMINDERS_PER_RUN =
  200;

export async function runRepresentativeReportReminders() {
  const client =
    await db.connect();

  let lockAcquired =
    false;

  try {
    const lockResult =
      await client.query(
        `
          SELECT pg_try_advisory_lock($1) AS locked
        `,
        [
          REMINDER_JOB_LOCK_ID,
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

        eligible:
          0,

        sent:
          0,

        failed:
          0,
      };
    }

    const candidates =
      await client.query(
        `
          SELECT
            representative.id,
            representative.name,
            representative.email,
            representative.last_report_reminder_sent_at,
            latest_report.last_report_at

          FROM sales_representatives representative

          INNER JOIN sales_representative_applications application
            ON application.id = representative.application_id

          LEFT JOIN LATERAL (
            SELECT MAX(report.created_at) AS last_report_at
            FROM representative_reports report
            WHERE report.representative_id = representative.id
          ) latest_report ON TRUE

          WHERE
            representative.is_active = TRUE
            AND application.status = 'accepted'
            AND COALESCE(
              latest_report.last_report_at,
              representative.created_at
            ) <= NOW() - INTERVAL '24 hours'
            AND (
              representative.last_report_reminder_sent_at IS NULL
              OR representative.last_report_reminder_sent_at <=
                NOW() - INTERVAL '24 hours'
            )

          ORDER BY COALESCE(
            latest_report.last_report_at,
            representative.created_at
          ) ASC

          LIMIT $1
        `,
        [
          MAX_REMINDERS_PER_RUN,
        ],
      );

    let sent =
      0;

    let failed =
      0;

    for (
      const candidate
      of candidates.rows
    ) {
      const previousReminderAt =
        candidate
          .last_report_reminder_sent_at ??
        null;

      /*
        Reserve this reminder in the database before contacting
        the email provider. The conditional update also protects
        against a report submitted after the candidate query.
      */

      const reservation =
        await client.query(
          `
            UPDATE sales_representatives representative
            SET
              last_report_reminder_sent_at = NOW(),
              updated_at = NOW()
            WHERE
              representative.id = $1
              AND representative.is_active = TRUE
              AND (
                representative.last_report_reminder_sent_at IS NULL
                OR representative.last_report_reminder_sent_at <=
                  NOW() - INTERVAL '24 hours'
              )
              AND NOT EXISTS (
                SELECT 1
                FROM representative_reports report
                WHERE
                  report.representative_id = representative.id
                  AND report.created_at > NOW() - INTERVAL '24 hours'
              )
            RETURNING last_report_reminder_sent_at
          `,
          [
            candidate.id,
          ],
        );

      if (
        reservation.rowCount ===
        0
      ) {
        continue;
      }

      const reservedAt =
        reservation.rows[0]
          .last_report_reminder_sent_at as Date;

      const dateKey =
        new Date(
          reservedAt,
        )
          .toISOString()
          .slice(
            0,
            10,
          );

      const delivered =
        await sendRepresentativeReportReminderEmail({
          representativeId:
            candidate.id,

          email:
            candidate.email,

          fullName:
            candidate.name,

          idempotencyKey:
            `representative-report-reminder/${candidate.id}/${dateKey}`,
        });

      if (
        delivered
      ) {
        sent +=
          1;

        continue;
      }

      failed +=
        1;

      /*
        Re-open eligibility after a confirmed send failure. The
        provider idempotency key still prevents a retry from
        creating a duplicate delivery for the same reminder day.
      */

      await client.query(
        `
          UPDATE sales_representatives
          SET
            last_report_reminder_sent_at = $2,
            updated_at = NOW()
          WHERE
            id = $1
            AND last_report_reminder_sent_at = $3
        `,
        [
          candidate.id,
          previousReminderAt,
          reservedAt,
        ],
      );
    }

    return {
      skipped:
        false,

      eligible:
        candidates.rowCount ??
        0,

      sent,

      failed,
    };
  } finally {
    if (
      lockAcquired
    ) {
      try {
        await client.query(
          `
            SELECT pg_advisory_unlock($1)
          `,
          [
            REMINDER_JOB_LOCK_ID,
          ],
        );
      } catch (
        error
      ) {
        console.error(
          "Unable to release representative reminder job lock:",
          error instanceof Error
            ? error.message
            : "Unknown lock error.",
        );
      }
    }

    client.release();
  }
}
