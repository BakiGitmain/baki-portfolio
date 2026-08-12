export type RepresentativeTrainingProgress = {
  watchedSeconds:
    number;

  completed:
    boolean;

  completedAt:
    string | null;
};

export type RepresentativeTrainingResource = {
  id:
    string;

  labelEn:
    string;

  labelAm:
    string;

  url:
    string;

  sortOrder:
    number;
};

export type RepresentativeTrainingLesson = {
  id:
    string;

  sectionId:
    string;

  titleEn:
    string;

  titleAm:
    string;

  summaryEn:
    string;

  summaryAm:
    string;

  notesEn:
    string;

  notesAm:
    string;

  videoUrl:
    string | null;

  durationSeconds:
    number;

  sortOrder:
    number;

  progress:
    RepresentativeTrainingProgress;

  resources:
    RepresentativeTrainingResource[];
};

export type RepresentativeTrainingSection = {
  id:
    string;

  courseId:
    string;

  titleEn:
    string;

  titleAm:
    string;

  descriptionEn:
    string;

  descriptionAm:
    string;

  sortOrder:
    number;

  lessons:
    RepresentativeTrainingLesson[];
};

export type RepresentativeTrainingCourse = {
  id:
    string;

  slug:
    string;

  titleEn:
    string;

  titleAm:
    string;

  descriptionEn:
    string;

  descriptionAm:
    string;

  sortOrder:
    number;

  progress: {
    totalLessons:
      number;

    completedLessons:
      number;

    progressPercent:
      number;

    totalDurationSeconds:
      number;
  };

  sections:
    RepresentativeTrainingSection[];
};

export type RepresentativeTrainingResponse = {
  success:
    true;

  courses:
    RepresentativeTrainingCourse[];

  overallProgress: {
    totalLessons:
      number;

    completedLessons:
      number;

    progressPercent:
      number;
  };
};

function getApiUrl() {
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

async function getErrorMessage(
  response:
    Response,
) {
  try {
    const body =
      await response.json();

    if (
      typeof body
        ?.message ===
      "string"
    ) {
      return body.message;
    }

    if (
      typeof body
        ?.message
        ?.en ===
      "string"
    ) {
      return body
        .message
        .en;
    }
  } catch {
    //
  }

  return "Something went wrong.";
}

async function apiRequest<T>(
  path:
    string,

  init?:
    RequestInit,
): Promise<T> {
  const response =
    await fetch(
      `${getApiUrl()}${path}`,

      {
        ...init,

        credentials:
          "include",

        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",

          ...(init?.body
            ? {
                "Content-Type":
                  "application/json",
              }
            : {}),

          ...(
            init?.headers ??
            {}
          ),
        },
      },
    );

  if (
    !response.ok
  ) {
    throw new Error(
      await getErrorMessage(
        response,
      ),
    );
  }

  return response.json();
}

export async function getRepresentativeTrainingCourses() {
  const result =
    await apiRequest<RepresentativeTrainingResponse>(
      "/api/representative/training/courses",
    );

  return result;
}

export async function saveRepresentativeLessonProgress(
  lessonId:
    string,

  watchedSeconds:
    number,

  durationSeconds:
    number,
) {
  const result =
    await apiRequest<{
      success:
        true;

      progress:
        RepresentativeTrainingProgress;
    }>(
      `/api/representative/training/lessons/${encodeURIComponent(
        lessonId,
      )}/progress`,

      {
        method:
          "POST",

        body:
          JSON.stringify({
            watchedSeconds,

            durationSeconds,
          }),
      },
    );

  return result.progress;
}