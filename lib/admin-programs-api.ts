export type PartnerProgramStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "completed"
  | "archived";

export type PartnerProgramTargetType =
  | "reports"
  | "lessons"
  | "course_completion";

export type PartnerProgramTarget = {
  id?:
    string;

  targetType:
    PartnerProgramTargetType;

  targetValue:
    number;

  courseId:
    string |
    null;

  courseTitleEn?:
    string |
    null;

  courseTitleAm?:
    string |
    null;

  sortOrder?:
    number;
};

export type PartnerProgram = {
  id:
    string;

  title:
    string;

  description:
    string;

  startDate:
    string;

  endDate:
    string;

  status:
    PartnerProgramStatus;

  effectiveStatus:
    PartnerProgramStatus;

  assignmentScope:
    "everyone" |
    "selected";

  icon:
    string |
    null;

  participantCount:
    number;

  targetCount:
    number;

  progressPercent:
    number;

  createdAt:
    string;

  updatedAt:
    string;
};

export type PartnerProgramDetail =
  PartnerProgram & {
    targets:
      PartnerProgramTarget[];

    representativeIds:
      string[];

    ranking:
      Array<{
        representativeId:
          string;

        name:
          string;

        partnerId:
          string;

        progressPercent:
          number;

        targets:
          Array<{
            targetId:
              string;

            targetType:
              PartnerProgramTargetType;

            targetValue:
              number;

            actualValue:
              number;

            courseId:
              string |
              null;
          }>;
      }>;
  };

export type PartnerProgramInput = {
  title:
    string;

  description:
    string;

  startDate:
    string;

  endDate:
    string;

  status:
    PartnerProgramStatus;

  assignmentScope:
    "everyone" |
    "selected";

  representativeIds:
    string[];

  icon:
    "target" |
    "growth" |
    "training" |
    "reports" |
    "star" |
    "calendar" |
    null;

  targets:
    PartnerProgramTarget[];
};

export type PartnerProgramOptions = {
  representatives:
    Array<{
      id:
        string;

      name:
        string;

      partnerId:
        string;
    }>;

  courses:
    Array<{
      id:
        string;

      titleEn:
        string;

      titleAm:
        string;

      status:
        "draft" |
        "published";
    }>;
};

function apiUrl() {
  const value =
    process.env
      .NEXT_PUBLIC_API_URL;

  if (
    !value
  ) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured.",
    );
  }

  return value.replace(
    /\/$/,
    "",
  );
}

async function request<T>(
  path:
    string,

  init?:
    RequestInit,
) {
  const response =
    await fetch(
      `${apiUrl()}${path}`,
      {
        ...init,

        credentials:
          "include",

        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",

          ...init?.headers,
        },
      },
    );

  if (
    !response.ok
  ) {
    let message =
      "Unable to save the program.";

    try {
      const body =
        await response.json();

      message =
        typeof body.message ===
          "string"
          ? body.message
          : body.message?.en ??
            message;
    } catch {
      // Keep the safe fallback.
    }

    throw new Error(
      message,
    );
  }

  return response.json() as
    Promise<T>;
}

export async function getAdminPrograms() {
  const result =
    await request<{
      programs:
        PartnerProgram[];
    }>(
      "/api/admin/programs",
    );

  return result.programs;
}

export async function getAdminProgramOptions() {
  return request<
    PartnerProgramOptions
  >(
    "/api/admin/programs/options",
  );
}

export async function getAdminProgram(
  programId:
    string,
) {
  const result =
    await request<{
      program:
        PartnerProgramDetail;
    }>(
      `/api/admin/programs/${encodeURIComponent(
        programId,
      )}`,
    );

  return result.program;
}

export async function createAdminProgram(
  input:
    PartnerProgramInput,
) {
  const result =
    await request<{
      program:
        PartnerProgramDetail;
    }>(
      "/api/admin/programs",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            input,
          ),
      },
    );

  return result.program;
}

export async function updateAdminProgram(
  programId:
    string,

  input:
    PartnerProgramInput,
) {
  const result =
    await request<{
      program:
        PartnerProgramDetail;
    }>(
      `/api/admin/programs/${encodeURIComponent(
        programId,
      )}`,
      {
        method:
          "PATCH",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            input,
          ),
      },
    );

  return result.program;
}

export async function archiveAdminProgram(
  programId:
    string,
) {
  await request(
    `/api/admin/programs/${encodeURIComponent(
      programId,
    )}`,
    {
      method:
        "DELETE",
    },
  );
}
