export type LocalizedText = {
  en: string;

  am: string;
};

export type ProjectStep = {
  title:
    LocalizedText;

  description:
    LocalizedText;
};

export type ProjectGalleryImage = {
  url:
    string;

  publicId:
    string;

  alt:
    LocalizedText;
};

export type Project = {
  id?:
    string;

  slug:
    string;

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
   NORMALIZE URL
   ========================================================= */

function normalizeApiUrl(
  url: string,
) {
  return url.replace(
    /\/$/,
    "",
  );
}

/* =========================================================
   API URL
   ========================================================= */

function getApiUrl() {
  const publicApiUrl =
    process.env
      .NEXT_PUBLIC_API_URL;

  /* =======================================================
     SERVER SIDE
     ======================================================= */

  if (
    typeof window ===
    "undefined"
  ) {
    const serverApiUrl =
      process.env
        .BACKEND_API_URL;

    if (
      serverApiUrl
    ) {
      return normalizeApiUrl(
        serverApiUrl,
      );
    }

    /*
     * Local development fallback.
     *
     * Example:
     * NEXT_PUBLIC_API_URL=http://localhost:5000
     */

    if (
      publicApiUrl?.startsWith(
        "http://",
      ) ||
      publicApiUrl?.startsWith(
        "https://",
      )
    ) {
      return normalizeApiUrl(
        publicApiUrl,
      );
    }

    throw new Error(
      "BACKEND_API_URL is not configured for server-side requests.",
    );
  }

  /* =======================================================
     BROWSER SIDE
     ======================================================= */

  if (
    !publicApiUrl
  ) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured.",
    );
  }

  return normalizeApiUrl(
    publicApiUrl,
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

  if (
    !response.ok
  ) {
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
   FEATURED PROJECTS
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

  if (
    !response.ok
  ) {
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
): Promise<
  Project | null
> {
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

  if (
    !response.ok
  ) {
    throw new Error(
      `Unable to load project. Status: ${response.status}`,
    );
  }

  const data =
    (await response.json()) as ProjectResponse;

  return (
    data.project ??
    null
  );
}