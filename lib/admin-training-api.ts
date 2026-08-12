export type TrainingLanguage =
  | "en"
  | "am";

export type TrainingCourseStatus =
  | "draft"
  | "published";

export type TrainingResource = {
  id: string;
  lessonId: string;

  labelEn: string;
  labelAm: string;

  url: string;

  sortOrder: number;

  createdAt: string;
  updatedAt: string;
};

export type TrainingLesson = {
  id: string;
  sectionId: string;

  titleEn: string;
  titleAm: string;

  summaryEn: string;
  summaryAm: string;

  notesEn: string;
  notesAm: string;

  videoUrl: string | null;
  videoPublicId: string | null;

  durationSeconds: number;

  sortOrder: number;

  isPreview: boolean;

  resources:
    TrainingResource[];

  createdAt: string;
  updatedAt: string;
};

export type TrainingSection = {
  id: string;
  courseId: string;

  titleEn: string;
  titleAm: string;

  descriptionEn: string;
  descriptionAm: string;

  sortOrder: number;

  lessons:
    TrainingLesson[];

  createdAt: string;
  updatedAt: string;
};

export type TrainingCourse = {
  id: string;

  slug: string;

  titleEn: string;
  titleAm: string;

  descriptionEn: string;
  descriptionAm: string;

  status:
    TrainingCourseStatus;

  sortOrder: number;

  sections:
    TrainingSection[];

  createdAt: string;
  updatedAt: string;
};

export type TrainingCourseInput = {
  slug: string;

  titleEn: string;
  titleAm: string;

  descriptionEn: string;
  descriptionAm: string;

  status:
    TrainingCourseStatus;

  sortOrder: number;
};

export type TrainingSectionInput = {
  titleEn: string;
  titleAm: string;

  descriptionEn: string;
  descriptionAm: string;

  sortOrder: number;
};

export type TrainingLessonInput = {
  titleEn: string;
  titleAm: string;

  summaryEn: string;
  summaryAm: string;

  notesEn: string;
  notesAm: string;

  videoUrl: string;
  videoPublicId: string;

  durationSeconds: number;

  sortOrder: number;

  isPreview: boolean;
};

export type TrainingResourceInput = {
  labelEn: string;
  labelAm: string;

  url: string;

  sortOrder: number;
};

type ApiMessage = {
  en?: string;
  am?: string;
};

type CoursesResponse = {
  success: boolean;

  courses:
    TrainingCourse[];
};

type UploadSignatureResponse = {
  success: boolean;

  uploadUrl: string;

  apiKey: string;

  signature: string;

  parameters: {
    timestamp: number;
    folder: string;
    public_id: string;
  };
};

function getApiUrl() {
  const apiUrl =
    process.env
      .NEXT_PUBLIC_API_URL;

  if (
    !apiUrl
  ) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured.",
    );
  }

  return apiUrl.replace(
    /\/$/,
    "",
  );
}

async function getApiError(
  response: Response,
  language: TrainingLanguage,
) {
  try {
    const body =
      (await response.json()) as {
        message?:
          | string
          | ApiMessage;
      };

    if (
      typeof body.message ===
      "string"
    ) {
      return body.message;
    }

    if (
      body.message &&
      typeof body.message[
        language
      ] === "string"
    ) {
      return body.message[
        language
      ] as string;
    }

    if (
      body.message &&
      typeof body
        .message
        .en === "string"
    ) {
      return body
        .message
        .en;
    }
  } catch {
    // Generic fallback below.
  }

  return language ===
    "am"
    ? "የtraining ጥያቄውን ማጠናቀቅ አልተቻለም።"
    : "Unable to complete the training request.";
}

async function trainingRequest<T>(
  path: string,

  language:
    TrainingLanguage,

  init:
    RequestInit = {},
): Promise<T> {
  const response =
    await fetch(
      `${getApiUrl()}/api/admin/training${path}`,
      {
        ...init,

        credentials:
          "include",

        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",

          ...(init.body
            ? {
                "Content-Type":
                  "application/json",
              }
            : {}),

          ...init.headers,
        },
      },
    );

  if (
    !response.ok
  ) {
    throw new Error(
      await getApiError(
        response,
        language,
      ),
    );
  }

  return (
    await response.json()
  ) as T;
}

export async function getTrainingCourses(
  language:
    TrainingLanguage,
) {
  const data =
    await trainingRequest<CoursesResponse>(
      "/courses",
      language,
      {
        method: "GET",
      },
    );

  return Array.isArray(
    data.courses,
  )
    ? data.courses
    : [];
}

export async function createTrainingCourse(
  input:
    TrainingCourseInput,

  language:
    TrainingLanguage,
) {
  await trainingRequest(
    "/courses",
    language,
    {
      method: "POST",

      body:
        JSON.stringify(
          input,
        ),
    },
  );
}

export async function updateTrainingCourse(
  courseId: string,

  input:
    TrainingCourseInput,

  language:
    TrainingLanguage,
) {
  await trainingRequest(
    `/courses/${encodeURIComponent(courseId)}`,
    language,
    {
      method: "PATCH",

      body:
        JSON.stringify(
          input,
        ),
    },
  );
}

export async function deleteTrainingCourse(
  courseId: string,

  language:
    TrainingLanguage,
) {
  await trainingRequest(
    `/courses/${encodeURIComponent(courseId)}`,
    language,
    {
      method:
        "DELETE",
    },
  );
}

export async function createTrainingSection(
  courseId: string,

  input:
    TrainingSectionInput,

  language:
    TrainingLanguage,
) {
  await trainingRequest(
    `/courses/${encodeURIComponent(courseId)}/sections`,

    language,

    {
      method: "POST",

      body:
        JSON.stringify(
          input,
        ),
    },
  );
}

export async function updateTrainingSection(
  sectionId: string,

  input:
    TrainingSectionInput,

  language:
    TrainingLanguage,
) {
  await trainingRequest(
    `/sections/${encodeURIComponent(sectionId)}`,

    language,

    {
      method: "PATCH",

      body:
        JSON.stringify(
          input,
        ),
    },
  );
}

export async function deleteTrainingSection(
  sectionId: string,

  language:
    TrainingLanguage,
) {
  await trainingRequest(
    `/sections/${encodeURIComponent(sectionId)}`,

    language,

    {
      method:
        "DELETE",
    },
  );
}

export async function createTrainingLesson(
  sectionId: string,

  input:
    TrainingLessonInput,

  language:
    TrainingLanguage,
) {
  await trainingRequest(
    `/sections/${encodeURIComponent(sectionId)}/lessons`,

    language,

    {
      method: "POST",

      body:
        JSON.stringify(
          input,
        ),
    },
  );
}

export async function updateTrainingLesson(
  lessonId: string,

  input:
    TrainingLessonInput,

  language:
    TrainingLanguage,
) {
  await trainingRequest(
    `/lessons/${encodeURIComponent(lessonId)}`,

    language,

    {
      method: "PATCH",

      body:
        JSON.stringify(
          input,
        ),
    },
  );
}

export async function deleteTrainingLesson(
  lessonId: string,

  language:
    TrainingLanguage,
) {
  await trainingRequest(
    `/lessons/${encodeURIComponent(lessonId)}`,

    language,

    {
      method:
        "DELETE",
    },
  );
}

export async function createTrainingResource(
  lessonId: string,

  input:
    TrainingResourceInput,

  language:
    TrainingLanguage,
) {
  await trainingRequest(
    `/lessons/${encodeURIComponent(lessonId)}/resources`,

    language,

    {
      method: "POST",

      body:
        JSON.stringify(
          input,
        ),
    },
  );
}

export async function updateTrainingResource(
  resourceId: string,

  input:
    TrainingResourceInput,

  language:
    TrainingLanguage,
) {
  await trainingRequest(
    `/resources/${encodeURIComponent(resourceId)}`,

    language,

    {
      method: "PATCH",

      body:
        JSON.stringify(
          input,
        ),
    },
  );
}

export async function deleteTrainingResource(
  resourceId: string,

  language:
    TrainingLanguage,
) {
  await trainingRequest(
    `/resources/${encodeURIComponent(resourceId)}`,

    language,

    {
      method:
        "DELETE",
    },
  );
}

async function getTrainingVideoUploadSignature(
  language:
    TrainingLanguage,
) {
  return await trainingRequest<UploadSignatureResponse>(
    "/video-upload-signature",

    language,

    {
      method: "POST",
    },
  );
}

export async function uploadTrainingVideo(
  file: File,

  language:
    TrainingLanguage,
) {
  const allowedTypes = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-m4v",
  ];

  if (
    !allowedTypes.includes(
      file.type,
    )
  ) {
    throw new Error(
      language === "am"
        ? "MP4፣ WEBM፣ MOV ወይም M4V video ይምረጡ።"
        : "Choose an MP4, WEBM, MOV or M4V video.",
    );
  }

  if (
    file.size >
    100 *
      1024 *
      1024
  ) {
    throw new Error(
      language === "am"
        ? "Phase 1 direct upload video ከ100 MB በታች መሆን አለበት።"
        : "Phase 1 direct-upload videos must be smaller than 100 MB.",
    );
  }

  const signed =
    await getTrainingVideoUploadSignature(
      language,
    );

  const formData =
    new FormData();

  formData.append(
    "file",
    file,
  );

  formData.append(
    "api_key",
    signed.apiKey,
  );

  formData.append(
    "signature",
    signed.signature,
  );

  formData.append(
    "timestamp",
    String(
      signed.parameters
        .timestamp,
    ),
  );

  formData.append(
    "folder",
    signed.parameters
      .folder,
  );

  formData.append(
    "public_id",
    signed.parameters
      .public_id,
  );

  const response =
    await fetch(
      signed.uploadUrl,
      {
        method:
          "POST",

        body:
          formData,
      },
    );

  if (
    !response.ok
  ) {
    throw new Error(
      language === "am"
        ? "Training video upload ማድረግ አልተቻለም።"
        : "Unable to upload the training video.",
    );
  }

  const data =
    (await response.json()) as {
      public_id?: string;

      secure_url?: string;

      duration?: number;
    };

  if (
    !data.public_id ||
    !data.secure_url
  ) {
    throw new Error(
      language === "am"
        ? "Cloudinary ትክክለኛ video response አልመለሰም።"
        : "Cloudinary returned an invalid video response.",
    );
  }

  return {
    publicId:
      data.public_id,

    secureUrl:
      data.secure_url,

    durationSeconds:
      typeof data.duration ===
        "number" &&
      Number.isFinite(
        data.duration,
      )
        ? Math.max(
            0,

            Math.round(
              data.duration,
            ),
          )
        : 0,
  };
}