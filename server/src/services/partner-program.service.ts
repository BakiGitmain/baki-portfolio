import {
  db,
} from "../config/db.js";

type ProgramRow =
  Record<
    string,
    unknown
  >;

function dateOnly(
  value:
    unknown,
) {
  if (
    value instanceof
    Date
  ) {
    return value
      .toISOString()
      .slice(
        0,
        10,
      );
  }

  return String(
    value,
  ).slice(
    0,
    10,
  );
}

function effectiveStatus(
  row:
    ProgramRow,
) {
  const stored =
    String(
      row.status,
    );

  if (
    stored ===
      "draft" ||
    stored ===
      "archived" ||
    stored ===
      "completed"
  ) {
    return stored;
  }

  const today =
    new Date()
      .toISOString()
      .slice(
        0,
        10,
      );

  const start =
    dateOnly(
      row.start_date,
    );

  const end =
    dateOnly(
      row.end_date,
    );

  if (
    today <
    start
  ) {
    return "scheduled";
  }

  if (
    today >
    end
  ) {
    return "completed";
  }

  return "active";
}

function mapProgram(
  row:
    ProgramRow,
) {
  return {
    id:
      row.id,

    title:
      row.title,

    description:
      row.description,

    startDate:
      dateOnly(
        row.start_date,
      ),

    endDate:
      dateOnly(
        row.end_date,
      ),

    status:
      row.status,

    effectiveStatus:
      effectiveStatus(
        row,
      ),

    assignmentScope:
      row.assignment_scope,

    icon:
      row.icon ??
      null,

    participantCount:
      Number(
        row.participant_count ??
          0,
      ),

    targetCount:
      Number(
        row.target_count ??
          0,
      ),

    progressPercent:
      Number(
        row.progress_percent ??
          0,
      ),

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
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
      SELECT
        CASE
          WHEN COUNT(lesson.id) = 0 THEN 0
          WHEN COUNT(progress.id) FILTER (
            WHERE progress.completed = TRUE
          ) = COUNT(lesson.id)
          AND MAX(progress.completed_at) >= program.start_date::timestamp
          AND MAX(progress.completed_at) < (program.end_date + 1)::timestamp
            THEN 1
          ELSE 0
        END::int
      FROM training_lessons lesson
      INNER JOIN training_sections section
        ON section.id = lesson.section_id
      LEFT JOIN representative_training_lesson_progress progress
        ON
          progress.lesson_id = lesson.id
          AND progress.representative_id = participant.representative_id
      WHERE section.course_id = target.course_id
    )

    ELSE 0
  END
`;

export async function listAdminPrograms() {
  const result =
    await db.query(
      `
        WITH participants AS (
          SELECT
            program.id AS program_id,
            representative.id AS representative_id
          FROM partner_programs program
          INNER JOIN sales_representatives representative
            ON representative.is_active = TRUE
          WHERE
            program.assignment_scope = 'everyone'
            OR EXISTS (
              SELECT 1
              FROM partner_program_assignments assignment
              WHERE
                assignment.program_id = program.id
                AND assignment.representative_id = representative.id
            )
        ),
        target_progress AS (
          SELECT
            program.id AS program_id,
            participant.representative_id,
            LEAST(
              100.0,
              100.0 * (${progressValueSql}) / target.target_value
            ) AS progress_percent
          FROM partner_programs program
          INNER JOIN participants participant
            ON participant.program_id = program.id
          INNER JOIN partner_program_targets target
            ON target.program_id = program.id
        ),
        progress AS (
          SELECT
            program_id,
            ROUND(AVG(progress_percent))::int AS progress_percent
          FROM target_progress
          GROUP BY program_id
        )
        SELECT
          program.*,
          (
            SELECT COUNT(*)::int
            FROM participants participant
            WHERE participant.program_id = program.id
          ) AS participant_count,
          (
            SELECT COUNT(*)::int
            FROM partner_program_targets target
            WHERE target.program_id = program.id
          ) AS target_count,
          COALESCE(progress.progress_percent, 0)::int AS progress_percent
        FROM partner_programs program
        LEFT JOIN progress
          ON progress.program_id = program.id
        ORDER BY
          CASE program.status
            WHEN 'active' THEN 0
            WHEN 'scheduled' THEN 1
            WHEN 'draft' THEN 2
            WHEN 'completed' THEN 3
            ELSE 4
          END,
          program.start_date DESC,
          program.updated_at DESC
      `,
    );

  return result.rows.map(
    mapProgram,
  );
}

export async function listRepresentativePrograms(
  representativeId:
    string,

  options?: {
    activeOnly?:
      boolean;
  },
) {
  const activeOnly =
    options?.activeOnly ??
    true;

  const result =
    await db.query(
      `
        WITH participant AS (
          SELECT
            program.id AS program_id,
            $1::uuid AS representative_id
          FROM partner_programs program
          WHERE
            (
              $2::boolean = FALSE
              OR (
                program.status NOT IN ('draft', 'archived', 'completed')
                AND CURRENT_DATE BETWEEN program.start_date AND program.end_date
              )
            )
            AND (
              program.assignment_scope = 'everyone'
              OR EXISTS (
                SELECT 1
                FROM partner_program_assignments assignment
                WHERE
                  assignment.program_id = program.id
                  AND assignment.representative_id = $1::uuid
              )
            )
        ),
        target_progress AS (
          SELECT
            program.id AS program_id,
            target.id AS target_id,
            target.target_type,
            target.target_value,
            target.course_id,
            course.title_en AS course_title_en,
            course.title_am AS course_title_am,
            (${progressValueSql})::int AS actual_value
          FROM partner_programs program
          INNER JOIN participant
            ON participant.program_id = program.id
          INNER JOIN partner_program_targets target
            ON target.program_id = program.id
          LEFT JOIN training_courses course
            ON course.id = target.course_id
        )
        SELECT
          program.*,
          1::int AS participant_count,
          COUNT(target_progress.target_id)::int AS target_count,
          COALESCE(
            ROUND(
              AVG(
                LEAST(
                  100.0,
                  100.0 * target_progress.actual_value /
                    NULLIF(target_progress.target_value, 0)
                )
              )
            ),
            0
          )::int AS progress_percent,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', target_progress.target_id,
                'targetType', target_progress.target_type,
                'targetValue', target_progress.target_value,
                'actualValue', target_progress.actual_value,
                'courseId', target_progress.course_id,
                'courseTitleEn', target_progress.course_title_en,
                'courseTitleAm', target_progress.course_title_am
              )
              ORDER BY target_progress.target_type, target_progress.course_title_en
            ) FILTER (WHERE target_progress.target_id IS NOT NULL),
            '[]'::json
          ) AS targets
        FROM partner_programs program
        INNER JOIN participant
          ON participant.program_id = program.id
        LEFT JOIN target_progress
          ON target_progress.program_id = program.id
        GROUP BY program.id
        ORDER BY program.end_date ASC, program.start_date ASC
      `,
      [
        representativeId,
        activeOnly,
      ],
    );

  return result.rows.map(
    (
      row,
    ) => ({
      ...mapProgram(
        row,
      ),

      targets:
        Array.isArray(
          row.targets,
        )
          ? row.targets
          : [],
    }),
  );
}

export async function getAdminProgramDetail(
  programId:
    string,
) {
  const [
    programResult,
    targetResult,
    progressResult,
  ] =
    await Promise.all([
      db.query(
        `
          SELECT
            program.*,
            (
              SELECT COUNT(*)::int
              FROM sales_representatives representative
              WHERE
                representative.is_active = TRUE
                AND (
                  program.assignment_scope = 'everyone'
                  OR EXISTS (
                    SELECT 1
                    FROM partner_program_assignments assignment
                    WHERE
                      assignment.program_id = program.id
                      AND assignment.representative_id = representative.id
                  )
                )
            ) AS participant_count,
            (
              SELECT COUNT(*)::int
              FROM partner_program_targets target
              WHERE target.program_id = program.id
            ) AS target_count,
            0::int AS progress_percent
          FROM partner_programs program
          WHERE program.id = $1::uuid
          LIMIT 1
        `,
        [
          programId,
        ],
      ),

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
          LEFT JOIN training_courses course
            ON course.id = target.course_id
          WHERE target.program_id = $1::uuid
          ORDER BY target.sort_order ASC, target.created_at ASC
        `,
        [
          programId,
        ],
      ),

      db.query(
        `
          WITH program AS (
            SELECT *
            FROM partner_programs
            WHERE id = $1::uuid
          ),
          participants AS (
            SELECT
              representative.id AS representative_id,
              COALESCE(
                NULLIF(TRIM(representative.display_name), ''),
                representative.name
              ) AS name,
              representative.username,
              representative.is_active
            FROM program
            INNER JOIN sales_representatives representative
              ON representative.is_active = TRUE
            WHERE
              program.assignment_scope = 'everyone'
              OR EXISTS (
                SELECT 1
                FROM partner_program_assignments assignment
                WHERE
                  assignment.program_id = program.id
                  AND assignment.representative_id = representative.id
              )
          ),
          target_values AS (
            SELECT
              participant.representative_id,
              participant.name,
              participant.username,
              target.id AS target_id,
              target.target_type,
              target.target_value,
              target.course_id,
              (${progressValueSql})::int AS actual_value
            FROM program
            INNER JOIN participants participant ON TRUE
            INNER JOIN partner_program_targets target
              ON target.program_id = program.id
          ),
          ranking AS (
            SELECT
              representative_id,
              name,
              username,
              COALESCE(
                ROUND(
                  AVG(
                    LEAST(
                      100.0,
                      100.0 * actual_value / NULLIF(target_value, 0)
                    )
                  )
                ),
                0
              )::int AS progress_percent
            FROM target_values
            GROUP BY representative_id, name, username
          )
          SELECT
            participant.representative_id,
            participant.name,
            participant.username,
            COALESCE(ranking.progress_percent, 0)::int AS progress_percent,
            COALESCE(
              JSON_AGG(
                JSON_BUILD_OBJECT(
                  'targetId', target_values.target_id,
                  'targetType', target_values.target_type,
                  'targetValue', target_values.target_value,
                  'actualValue', target_values.actual_value,
                  'courseId', target_values.course_id
                )
                ORDER BY target_values.target_type, target_values.target_id
              ) FILTER (WHERE target_values.target_id IS NOT NULL),
              '[]'::json
            ) AS targets
          FROM participants participant
          LEFT JOIN ranking
            ON ranking.representative_id = participant.representative_id
          LEFT JOIN target_values
            ON target_values.representative_id = participant.representative_id
          GROUP BY
            participant.representative_id,
            participant.name,
            participant.username,
            ranking.progress_percent
          ORDER BY
            progress_percent DESC,
            participant.name ASC
        `,
        [
          programId,
        ],
      ),
    ]);

  const row =
    programResult.rows[0];

  if (
    !row
  ) {
    return null;
  }

  const ranking =
    progressResult.rows.map(
      (
        participant,
      ) => ({
        representativeId:
          participant.representative_id,

        name:
          participant.name,

        partnerId:
          participant.username,

        progressPercent:
          Number(
            participant.progress_percent,
          ),

        targets:
          Array.isArray(
            participant.targets,
          )
            ? participant.targets
            : [],
      }),
    );

  const progressPercent =
    ranking.length >
    0
      ? Math.round(
          ranking.reduce(
            (
              total,
              participant,
            ) =>
              total +
              participant.progressPercent,
            0,
          ) /
            ranking.length,
        )
      : 0;

  return {
    ...mapProgram({
      ...row,
      progress_percent:
        progressPercent,
    }),

    targets:
      targetResult.rows.map(
        (
          target,
        ) => ({
          id:
            target.id,

          targetType:
            target.target_type,

          targetValue:
            Number(
              target.target_value,
            ),

          courseId:
            target.course_id ??
            null,

          courseTitleEn:
            target.course_title_en ??
            null,

          courseTitleAm:
            target.course_title_am ??
            null,

          sortOrder:
            Number(
              target.sort_order,
            ),
        }),
      ),

    representativeIds:
      ranking.map(
        (
          participant,
        ) =>
          participant.representativeId,
      ),

    ranking,
  };
}
