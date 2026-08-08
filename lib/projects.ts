export type LocalizedText = {
  en: string;
  am: string;
};

export type ProjectStep = {
  title: LocalizedText;

  description:
    LocalizedText;
};

export type ProjectGalleryImage = {
  url: string;

  publicId:
    string;

  alt:
    LocalizedText;
};

export type Project = {
  id?: string;

  slug: string;

  title:
    LocalizedText;

  thumbnail:
    string;

  category:
    LocalizedText;

  shortDescription:
    LocalizedText;

  description:
    LocalizedText;

  technologies:
    string[];

  year:
    string;

  status:
    LocalizedText;

  role:
    LocalizedText;

  overview:
    LocalizedText;

  challenge:
    LocalizedText;

  solution:
    LocalizedText;

  howItWorks:
    ProjectStep[];

  features:
    LocalizedText[];

  gallery:
    ProjectGalleryImage[];

  liveUrl?:
    string | null;

  githubUrl?:
    string | null;

  featured:
    boolean;

  sortOrder?:
    number;

  createdAt?:
    string;

  updatedAt?:
    string;
};

type ProjectsResponse = {
  success:
    boolean;

  projects:
    Project[];
};

type ProjectResponse = {
  success:
    boolean;

  project:
    Project;
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
   ALL PROJECTS
   ========================================================= */

export async function getProjects(): Promise<
  Project[]
> {
  const response =
    await fetch(
      `${getApiUrl()}/api/projects`,
      {
        method:
          "GET",

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
      "Unable to load projects.",
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
   FEATURED
   ========================================================= */

export async function getFeaturedProjects(): Promise<
  Project[]
> {
  const response =
    await fetch(
      `${getApiUrl()}/api/projects?featured=true`,
      {
        method:
          "GET",

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
      "Unable to load featured projects.",
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
   PROJECT BY SLUG
   ========================================================= */

export async function getProjectBySlug(
  slug:
    string,
): Promise<Project | null> {
  const response =
    await fetch(
      `${getApiUrl()}/api/projects/${encodeURIComponent(
        slug,
      )}`,
      {
        method:
          "GET",

        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",
        },
      },
    );

  if (
    response.status ===
    404
  ) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      "Unable to load project.",
    );
  }

  const data =
    (await response.json()) as ProjectResponse;

  return data.project ??
    null;
}