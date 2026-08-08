export type ProjectStatus =
  | "draft"
  | "published";

export type AdminLocalizedText = {
  en:
    string;

  am:
    string;
};

export type AdminProjectStep = {
  title:
    AdminLocalizedText;

  description:
    AdminLocalizedText;
};

export type AdminGalleryImage = {
  publicId:
    string;

  url:
    string;

  altEn:
    string;

  altAm:
    string;
};

export type ProjectGalleryInput = {
  publicId:
    string;

  altEn:
    string;

  altAm:
    string;
};

export type PortfolioProject = {
  id:
    string;

  slug:
    string;

  titleEn:
    string;

  titleAm:
    string;

  categoryEn:
    string;

  categoryAm:
    string;

  shortDescriptionEn:
    string;

  shortDescriptionAm:
    string;

  descriptionEn:
    string;

  descriptionAm:
    string;

  technologies:
    string[];

  coverImageUrl:
    string;

  coverImagePublicId:
    string;

  liveUrl:
    string | null;

  status:
    ProjectStatus;

  featured:
    boolean;

  sortOrder:
    number;

  projectYear:
    string;

  roleEn:
    string;

  roleAm:
    string;

  displayStatusEn:
    string;

  displayStatusAm:
    string;

  overviewEn:
    string;

  overviewAm:
    string;

  challengeEn:
    string;

  challengeAm:
    string;

  solutionEn:
    string;

  solutionAm:
    string;

  howItWorks:
    AdminProjectStep[];

  features:
    AdminLocalizedText[];

  gallery:
    AdminGalleryImage[];

  createdAt:
    string;

  updatedAt:
    string;
};

export type ProjectInput = {
  slug:
    string;

  titleEn:
    string;

  titleAm:
    string;

  categoryEn:
    string;

  categoryAm:
    string;

  shortDescriptionEn:
    string;

  shortDescriptionAm:
    string;

  descriptionEn:
    string;

  descriptionAm:
    string;

  technologies:
    string[];

  coverImagePublicId:
    string;

  liveUrl:
    string;

  status:
    ProjectStatus;

  featured:
    boolean;

  sortOrder:
    number;

  projectYear:
    string;

  roleEn:
    string;

  roleAm:
    string;

  displayStatusEn:
    string;

  displayStatusAm:
    string;

  overviewEn:
    string;

  overviewAm:
    string;

  challengeEn:
    string;

  challengeAm:
    string;

  solutionEn:
    string;

  solutionAm:
    string;

  howItWorks:
    AdminProjectStep[];

  features:
    AdminLocalizedText[];

  gallery:
    ProjectGalleryInput[];
};

type Language =
  | "en"
  | "am";

type ApiMessage = {
  en?:
    string;

  am?:
    string;
};

type ProjectsResponse = {
  success:
    boolean;

  projects:
    PortfolioProject[];
};

type ProjectResponse = {
  success:
    boolean;

  project:
    PortfolioProject;
};

type UploadSignatureResponse = {
  success:
    boolean;

  uploadUrl:
    string;

  apiKey:
    string;

  signature:
    string;

  parameters: {
    timestamp:
      number;

    folder:
      string;

    public_id:
      string;
  };
};

/* =========================================================
   API URL
   ========================================================= */

function getApiUrl() {
  const apiUrl =
    process.env
      .NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured.",
    );
  }

  return apiUrl.replace(
    /\/$/,
    "",
  );
}

/* =========================================================
   ERROR
   ========================================================= */

async function getApiError(
  response:
    Response,

  language:
    Language,
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
      typeof body.message.en ===
        "string"
    ) {
      return body.message.en;
    }
  } catch {
    //
  }

  return language ===
    "am"
    ? "አንድ ችግር ተፈጥሯል።"
    : "Something went wrong.";
}

/* =========================================================
   GET ADMIN PROJECTS
   ========================================================= */

export async function getAdminProjects(
  language:
    Language,
): Promise<
  PortfolioProject[]
> {
  const response =
    await fetch(
      `${getApiUrl()}/api/admin/projects`,
      {
        method:
          "GET",

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

  if (!response.ok) {
    throw new Error(
      await getApiError(
        response,
        language,
      ),
    );
  }

  const data =
    (await response.json()) as ProjectsResponse;

  return Array.isArray(
    data.projects,
  )
    ? data.projects
    : [];
}

/* =========================================================
   CREATE
   ========================================================= */

export async function createProject(
  input:
    ProjectInput,

  language:
    Language,
): Promise<PortfolioProject> {
  const response =
    await fetch(
      `${getApiUrl()}/api/admin/projects`,
      {
        method:
          "POST",

        credentials:
          "include",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",
        },

        body:
          JSON.stringify(
            input,
          ),
      },
    );

  if (!response.ok) {
    throw new Error(
      await getApiError(
        response,
        language,
      ),
    );
  }

  const data =
    (await response.json()) as ProjectResponse;

  return data.project;
}

/* =========================================================
   UPDATE
   ========================================================= */

export async function updateProject(
  id:
    string,

  input:
    ProjectInput,

  language:
    Language,
): Promise<PortfolioProject> {
  const response =
    await fetch(
      `${getApiUrl()}/api/admin/projects/${encodeURIComponent(
        id,
      )}`,
      {
        method:
          "PATCH",

        credentials:
          "include",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",
        },

        body:
          JSON.stringify(
            input,
          ),
      },
    );

  if (!response.ok) {
    throw new Error(
      await getApiError(
        response,
        language,
      ),
    );
  }

  const data =
    (await response.json()) as ProjectResponse;

  return data.project;
}

/* =========================================================
   DELETE
   ========================================================= */

export async function deleteProject(
  id:
    string,

  language:
    Language,
) {
  const response =
    await fetch(
      `${getApiUrl()}/api/admin/projects/${encodeURIComponent(
        id,
      )}`,
      {
        method:
          "DELETE",

        credentials:
          "include",

        headers: {
          Accept:
            "application/json",
        },
      },
    );

  if (!response.ok) {
    throw new Error(
      await getApiError(
        response,
        language,
      ),
    );
  }
}

/* =========================================================
   SIGNATURE
   ========================================================= */

async function getProjectUploadSignature(
  language:
    Language,
): Promise<UploadSignatureResponse> {
  const response =
    await fetch(
      `${getApiUrl()}/api/admin/projects/upload-signature`,
      {
        method:
          "POST",

        credentials:
          "include",

        headers: {
          Accept:
            "application/json",
        },
      },
    );

  if (!response.ok) {
    throw new Error(
      await getApiError(
        response,
        language,
      ),
    );
  }

  return await response.json() as UploadSignatureResponse;
}

/* =========================================================
   IMAGE UPLOAD
   ========================================================= */

export async function uploadProjectImage(
  file:
    File,

  language:
    Language,
) {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (
    !allowedTypes.includes(
      file.type,
    )
  ) {
    throw new Error(
      language ===
        "am"
        ? "JPG፣ PNG ወይም WEBP ምስል ይምረጡ።"
        : "Choose a JPG, PNG or WEBP image.",
    );
  }

  if (
    file.size >
    8 *
      1024 *
      1024
  ) {
    throw new Error(
      language ===
        "am"
        ? "ምስሉ ከ8 MB በታች መሆን አለበት።"
        : "The image must be smaller than 8 MB.",
    );
  }

  const signed =
    await getProjectUploadSignature(
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

  if (!response.ok) {
    throw new Error(
      language ===
        "am"
        ? "ምስሉን upload ማድረግ አልተቻለም።"
        : "Unable to upload image.",
    );
  }

  const data =
    (await response.json()) as {
      public_id?:
        string;

      secure_url?:
        string;
    };

  if (
    !data.public_id ||
    !data.secure_url
  ) {
    throw new Error(
      "Cloudinary returned an invalid upload response.",
    );
  }

  return {
    publicId:
      data.public_id,

    secureUrl:
      data.secure_url,
  };
}