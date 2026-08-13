import {
  db,
} from "../config/db.js";

import {
  loadChatIdentity,
} from "./partner-chat-auth.service.js";

import {
  getPartnerChatUnreadCount,
} from "./partner-chat.service.js";

import {
  getRepresentativeProgramNotificationCount,
} from "./partner-program.service.js";

export type RepresentativeAttention = {
  chat:
    number;

  reports:
    number;

  programs:
    number;

  training:
    number;

  total:
    number;
};

export async function getRepresentativeAttention(
  input: {
    representativeId:
      string;

    sessionVersion:
      number;
  },
): Promise<RepresentativeAttention> {
  const identity =
    await loadChatIdentity({
      id:
        input.representativeId,

      role:
        "representative",

      sessionVersion:
        input.sessionVersion,
    });

  const [
    chat,
    reportsResult,
    programs,
    trainingResult,
  ] =
    await Promise.all([
      identity
        ? getPartnerChatUnreadCount(
            identity,
          )
        : Promise.resolve(
            0,
          ),

      db.query<{
        count:
          number;
      }>(
        `
          SELECT COUNT(*)::int AS count
          FROM representative_report_replies reply
          INNER JOIN representative_reports report
            ON report.id = reply.report_id
          WHERE
            report.representative_id = $1::uuid
            AND reply.representative_read_at IS NULL
        `,
        [
          input.representativeId,
        ],
      ),

      getRepresentativeProgramNotificationCount(
        input.representativeId,
      ),

      db.query<{
        count:
          number;
      }>(
        `
          SELECT CASE
            WHEN EXISTS (
              SELECT 1
              FROM training_lessons lesson
              INNER JOIN training_sections section
                ON section.id = lesson.section_id
              INNER JOIN training_courses course
                ON course.id = section.course_id
              WHERE course.status = 'published'
            )
            AND NOT EXISTS (
              SELECT 1
              FROM representative_training_lesson_progress progress
              INNER JOIN training_lessons lesson
                ON lesson.id = progress.lesson_id
              INNER JOIN training_sections section
                ON section.id = lesson.section_id
              INNER JOIN training_courses course
                ON course.id = section.course_id
              WHERE
                progress.representative_id = $1::uuid
                AND course.status = 'published'
                AND (
                  progress.last_position_seconds > 0
                  OR progress.completed = TRUE
                )
            )
              THEN 1
            ELSE 0
          END::int AS count
        `,
        [
          input.representativeId,
        ],
      ),
    ]);

  const counts = {
    chat:
      Math.max(
        0,
        Number(
          chat,
        ),
      ),

    reports:
      Math.max(
        0,
        Number(
          reportsResult.rows[0]
            ?.count ??
            0,
        ),
      ),

    programs:
      Math.max(
        0,
        Number(
          programs,
        ),
      ),

    training:
      Math.max(
        0,
        Number(
          trainingResult.rows[0]
            ?.count ??
            0,
        ),
      ),
  };

  return {
    ...counts,

    total:
      counts.chat +
      counts.reports +
      counts.programs +
      counts.training,
  };
}
