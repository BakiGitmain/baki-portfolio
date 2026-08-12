export type AdminDashboardRange =
  | 7
  | 30
  | 90;

export type AdminDashboardData = {
  rangeDays:
    AdminDashboardRange;

  generatedAt:
    string;

  capabilities: {
    leads: {
      available:
        false;

      reason:
        string;
    };

    liveChatPresence:
      boolean;
  };

  metrics: {
    totalPartners:
      number;

    activePartners:
      number;

    operationalPartners:
      number;

    applications: {
      current:
        number;

      previous:
        number;

      pending:
        number;
    };

    reports: {
      today:
        number;

      week:
        number;

      current:
        number;

      previous:
        number;

      unread:
        number;
    };

    lessonCompletions: {
      current:
        number;

      previous:
        number;
    };

    publishedCourses:
      number;

    activePrograms:
      number;

    onlinePartners:
      number |
      null;
  };

  reportStats: {
    total:
      number;

    activeReporters:
      number;

    averagePerActivePartner:
      number;

    replied:
      number;

    averageReplyMinutes:
      number |
      null;
  };

  activitySeries:
    Array<{
      date:
        string;

      reports:
        number;

      lessonCompletions:
        number;

      applications:
        number;
    }>;

  training: {
    distribution:
      Array<{
        bucket:
          string;

        partners:
          number;
      }>;

    courses:
      Array<{
        id:
          string;

        titleEn:
          string;

        titleAm:
          string;

        lessons:
          number;

        completedLessons:
          number;

        completionPercent:
          number;
      }>;
  };

  partnerPerformance:
    Array<{
      id:
        string;

      name:
        string;

      partnerId:
        string;

      reports:
        number;

      lessonCompletions:
        number;

      trainingPercent:
        number;

      lastActivityAt:
        string |
        null;
    }>;

  recentActivity:
    Array<{
      type:
        string;

      entityId:
        string;

      representativeName:
        string |
        null;

      subject:
        string;

      createdAt:
        string;
    }>;

  attention:
    Array<{
      severity:
        "high" |
        "medium";

      type:
        string;

      entityId:
        string;

      label:
        string;

      createdAt:
        string;

      href:
        string;
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

export async function getAdminDashboard(
  range:
    AdminDashboardRange,
) {
  const response =
    await fetch(
      `${apiUrl()}/api/admin/dashboard/overview?range=${range}`,
      {
        credentials:
          "include",

        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",
        },
      },
    );

  if (
    !response.ok
  ) {
    throw new Error(
      "Unable to load the operations dashboard.",
    );
  }

  const result =
    await response.json() as
      AdminDashboardData & {
        success:
          true;
      };

  return result;
}
