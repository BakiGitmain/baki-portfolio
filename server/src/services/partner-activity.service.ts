import {
  db,
} from "../config/db.js";

type ActivityActor =
  | "admin"
  | "representative"
  | "system";

type PartnerActivityInput = {
  eventType:
    string;

  actorType:
    ActivityActor;

  representativeId?:
    string |
    null;

  adminUserId?:
    string |
    null;

  applicationId?:
    string |
    null;

  reportId?:
    string |
    null;

  programId?:
    string |
    null;

  metadata?:
    Record<
      string,
      unknown
    >;
};

/*
  Operational activity must never undo the business action
  it describes. Native source tables remain authoritative;
  this table adds context for events such as profile changes,
  assignments and status transitions.
*/
export async function recordPartnerActivity(
  input:
    PartnerActivityInput,
) {
  try {
    await db.query(
      `
        INSERT INTO partner_activity_events (
          event_type,
          actor_type,
          representative_id,
          admin_user_id,
          application_id,
          report_id,
          program_id,
          metadata
        )
        VALUES (
          $1::varchar,
          $2::varchar,
          $3::uuid,
          $4::uuid,
          $5::uuid,
          $6::uuid,
          $7::uuid,
          $8::jsonb
        )
      `,
      [
        input.eventType,
        input.actorType,
        input.representativeId ??
          null,
        input.adminUserId ??
          null,
        input.applicationId ??
          null,
        input.reportId ??
          null,
        input.programId ??
          null,
        JSON.stringify(
          input.metadata ??
            {},
        ),
      ],
    );
  } catch (
    error
  ) {
    console.error(
      "Unable to record partner activity:",
      error instanceof
        Error
        ? error.message
        : "Unknown activity error.",
    );
  }
}
