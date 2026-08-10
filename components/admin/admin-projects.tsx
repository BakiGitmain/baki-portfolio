/* eslint-disable @next/next/no-img-element */

"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import AdminShell from "@/components/admin/admin-shell";

import {
  useLanguage,
} from "@/components/providers/language-provider";

import {
  createProject,
  deleteProject,
  getAdminProjects,
  updateProject,
  uploadProjectImage,
  type AdminLocalizedText,
  type AdminProjectStep,
  type PortfolioProject,
  type ProjectGalleryInput,
  type ProjectInput,
  type ProjectStatus,
} from "@/lib/projects-api";

/* =========================================================
   TYPES
   ========================================================= */

type EditorMode =
  | "create"
  | "edit";

type EditorTab =
  | "basic"
  | "case-study"
  | "gallery";

type GalleryEditorItem = {
  id: string;

  publicId: string;

  url: string;

  previewUrl: string;

  altEn: string;

  altAm: string;

  file: File | null;
};

type ProjectForm = {
  slug: string;

  titleEn: string;

  titleAm: string;

  categoryEn: string;

  categoryAm: string;

  shortDescriptionEn: string;

  shortDescriptionAm: string;

  descriptionEn: string;

  descriptionAm: string;

  technologies: string;

  liveUrl: string;

  coverImagePublicId: string;

  coverImageUrl: string;

  status: ProjectStatus;

  featured: boolean;

  sortOrder: number;

  projectYear: string;

  roleEn: string;

  roleAm: string;

  displayStatusEn: string;

  displayStatusAm: string;

  overviewEn: string;

  overviewAm: string;

  challengeEn: string;

  challengeAm: string;

  solutionEn: string;

  solutionAm: string;

  howItWorks: AdminProjectStep[];

  features: AdminLocalizedText[];

  gallery: GalleryEditorItem[];
};

/* =========================================================
   DEFAULT FORM
   ========================================================= */

function createEmptyForm():
  ProjectForm {
  return {
    slug:
      "",

    titleEn:
      "",

    titleAm:
      "",

    categoryEn:
      "",

    categoryAm:
      "",

    shortDescriptionEn:
      "",

    shortDescriptionAm:
      "",

    descriptionEn:
      "",

    descriptionAm:
      "",

    technologies:
      "",

    liveUrl:
      "",

    coverImagePublicId:
      "",

    coverImageUrl:
      "",

    status:
      "draft",

    featured:
      false,

    sortOrder:
      0,

    projectYear:
      String(
        new Date().getFullYear(),
      ),

    roleEn:
      "Full-Stack Development",

    roleAm:
      "Full-Stack ልማት",

    displayStatusEn:
      "Completed",

    displayStatusAm:
      "ተጠናቋል",

    overviewEn:
      "",

    overviewAm:
      "",

    challengeEn:
      "",

    challengeAm:
      "",

    solutionEn:
      "",

    solutionAm:
      "",

    howItWorks:
      [],

    features:
      [],

    gallery:
      [],
  };
}

/* =========================================================
   HELPERS
   ========================================================= */

function slugify(
  value:
    string,
) {
  return value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    );
}

function sortProjects(
  projects:
    PortfolioProject[],
) {
  return [
    ...projects,
  ].sort(
    (
      a,
      b,
    ) =>
      a.sortOrder -
        b.sortOrder ||
      a.titleEn.localeCompare(
        b.titleEn,
      ),
  );
}

function projectToForm(
  project:
    PortfolioProject,
): ProjectForm {
  return {
    slug:
      project.slug,

    titleEn:
      project.titleEn,

    titleAm:
      project.titleAm,

    categoryEn:
      project.categoryEn,

    categoryAm:
      project.categoryAm,

    shortDescriptionEn:
      project.shortDescriptionEn,

    shortDescriptionAm:
      project.shortDescriptionAm,

    descriptionEn:
      project.descriptionEn,

    descriptionAm:
      project.descriptionAm,

    technologies:
      project.technologies.join(
        ", ",
      ),

    liveUrl:
      project.liveUrl ??
      "",

    coverImagePublicId:
      project.coverImagePublicId,

    coverImageUrl:
      project.coverImageUrl,

    status:
      project.status,

    featured:
      project.featured,

    sortOrder:
      project.sortOrder,

    projectYear:
      project.projectYear,

    roleEn:
      project.roleEn,

    roleAm:
      project.roleAm,

    displayStatusEn:
      project.displayStatusEn,

    displayStatusAm:
      project.displayStatusAm,

    overviewEn:
      project.overviewEn,

    overviewAm:
      project.overviewAm,

    challengeEn:
      project.challengeEn,

    challengeAm:
      project.challengeAm,

    solutionEn:
      project.solutionEn,

    solutionAm:
      project.solutionAm,

    howItWorks:
      project.howItWorks ??
      [],

    features:
      project.features ??
      [],

    gallery:
      (
        project.gallery ??
        []
      ).map(
        (
          image,
          index,
        ) => ({
          id:
            `existing-${image.publicId}-${index}`,

          publicId:
            image.publicId,

          url:
            image.url,

          previewUrl:
            image.url,

          altEn:
            image.altEn,

          altAm:
            image.altAm,

          file:
            null,
        }),
      ),
  };
}

/* =========================================================
   FIELD
   ========================================================= */

function Field({
  label,
  children,
  full = false,
}: {
  label:
    string;

  children:
    ReactNode;

  full?:
    boolean;
}) {
  return (
    <label
      className={
        full
          ? "block min-w-0 lg:col-span-2"
          : "block min-w-0"
      }
    >
      <span className="mb-2.5 block text-[8px] font-extrabold uppercase tracking-[0.14em] text-[#70776c]">
        {
          label
        }
      </span>

      {
        children
      }
    </label>
  );
}

/* =========================================================
   SECTION CARD
   ========================================================= */

function EditorSection({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow?:
    string;

  title:
    string;

  description?:
    string;

  action?:
    ReactNode;

  children:
    ReactNode;
}) {
  return (
    <section className="rounded-[20px] border border-black/[0.06] bg-white p-5 shadow-[0_8px_30px_rgba(31,45,24,0.025)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {eyebrow && (
            <span className="text-[7px] font-extrabold uppercase tracking-[0.17em] text-[#6a944d]">
              {
                eyebrow
              }
            </span>
          )}

          <h4 className="mt-1 text-[15px] font-black tracking-[-0.035em] text-[#20251d]">
            {
              title
            }
          </h4>

          {description && (
            <p className="mt-1.5 max-w-[520px] text-[8px] leading-5 text-black/35">
              {
                description
              }
            </p>
          )}
        </div>

        {action}
      </div>

      <div className="mt-5">
        {
          children
        }
      </div>
    </section>
  );
}

/* =========================================================
   ICONS
   ========================================================= */

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 5V19M5 12H19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 20H8L19 9C20.1 7.9 20.1 6.1 19 5C17.9 3.9 16.1 3.9 15 5L4 16V20Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 7H19M9 7V4H15V7M7 7L8 20H16L17 7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M15 6L9 12L15 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 6L15 12L9 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3.5"
        y="4"
        width="17"
        height="16"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      <circle
        cx="9"
        cy="9"
        r="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      <path
        d="M5.5 17L10 12.5L13 15L15.5 12.5L18.5 15.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function AdminProjects() {
  const {
    language,
  } = useLanguage();

  const [
    projects,
    setProjects,
  ] =
    useState<
      PortfolioProject[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  const [
    search,
    setSearch,
  ] =
    useState(
      "",
    );

  const [
    editorOpen,
    setEditorOpen,
  ] =
    useState(
      false,
    );

  const [
    editorMode,
    setEditorMode,
  ] =
    useState<EditorMode>(
      "create",
    );

  const [
    editorTab,
    setEditorTab,
  ] =
    useState<EditorTab>(
      "basic",
    );

  const [
    editingId,
    setEditingId,
  ] =
    useState<
      string |
      null
    >(
      null,
    );

  const [
    form,
    setForm,
  ] =
    useState<ProjectForm>(
      createEmptyForm,
    );

  const [
    selectedFile,
    setSelectedFile,
  ] =
    useState<
      File |
      null
    >(
      null,
    );

  const [
    previewUrl,
    setPreviewUrl,
  ] =
    useState(
      "",
    );

  const [
    saving,
    setSaving,
  ] =
    useState(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState(
      "",
    );

  const [
    success,
    setSuccess,
  ] =
    useState(
      "",
    );

  /* =======================================================
     COPY
     ======================================================= */

  const copy =
    language ===
    "am"
      ? {
          eyebrow:
            "PORTFOLIO CONTENT",

          title:
            "ፕሮጀክቶች",

          description:
            "Portfolio projectsን create፣ edit፣ publish እና manage ያድርጉ።",

          add:
            "ፕሮጀክት ጨምር",

          total:
            "ጠቅላላ",

          published:
            "Published",

          drafts:
            "Drafts",

          featured:
            "Featured",

          search:
            "ፕሮጀክቶችን ይፈልጉ...",

          edit:
            "Edit",

          basic:
            "Basic Info",

          caseStudy:
            "Case Study",

          gallery:
            "Gallery",

          createTitle:
            "አዲስ ፕሮጀክት",

          editTitle:
            "ፕሮጀክት አስተካክል",

          createDescription:
            "አዲስ portfolio project ይፍጠሩ እና መረጃውን ያዘጋጁ።",

          editDescription:
            "የproject መረጃ፣ case study እና gallery ያስተካክሉ።",

          save:
            "Save Project",

          saving:
            "Saving...",

          cancel:
            "Cancel",

          required:
            "Required fieldsን ሙሉ በሙሉ ይሙሉ።",

          imageRequired:
            "Project image ይምረጡ።",

          created:
            "ፕሮጀክቱ ተፈጥሯል።",

          updated:
            "ፕሮጀክቱ ተቀይሯል።",

          deleted:
            "ፕሮጀክቱ ተሰርዟል።",

          cover:
            "Project Cover",

          addCover:
            "Project cover ይጨምሩ",

          changeCover:
            "Cover Image ቀይር",

          selectCover:
            "Cover Image ምረጥ",

          recommended:
            "Landscape image መጠቀም ይመከራል",

          featuredDescription:
            "ይህን project በfeatured portfolio section ውስጥ ያሳዩ።",

          howItWorks:
            "How It Works",

          howItWorksDescription:
            "Project workflow ወይም system process በsteps ያስገቡ።",

          addStep:
            "Step ጨምር",

          featuresTitle:
            "Key Features",

          featuresDescription:
            "Public case study ላይ የሚታዩ main featuresን ያስገቡ።",

          addFeature:
            "Feature ጨምር",

          remove:
            "Remove",

          galleryTitle:
            "Website Screens",

          galleryDescription:
            "እስከ 5 screenshots ያክሉ። እዚህ ያለው order public slider ላይም ይጠቀማል።",

          addGallery:
            "Gallery Images ጨምር",

          noGallery:
            "እስካሁን gallery image የለም",

          noGalleryDescription:
            "Gallery screenshot እስኪጨምሩ ድረስ cover image ይጠቀማል።",

          removeImage:
            "Image አስወግድ",

          noProjects:
            "Project አልተገኘም።",

          noProjectsDescription:
            "Search ይቀይሩ ወይም አዲስ project ይጨምሩ።",

          footerCreate:
            "Projectን save ከማድረግዎ በፊት required fieldsን ይሙሉ።",

          footerEdit:
            "Save ሲደረግ existing project ይ更新ራል።",
        }
      : {
          eyebrow:
            "PORTFOLIO CONTENT",

          title:
            "Projects",

          description:
            "Add, edit, publish and manage the projects displayed across your portfolio.",

          add:
            "Add Project",

          total:
            "Total Projects",

          published:
            "Published",

          drafts:
            "Drafts",

          featured:
            "Featured",

          search:
            "Search projects...",

          edit:
            "Edit",

          basic:
            "Basic Info",

          caseStudy:
            "Case Study",

          gallery:
            "Gallery",

          createTitle:
            "Add Project",

          editTitle:
            "Edit Project",

          createDescription:
            "Create and configure a new portfolio project.",

          editDescription:
            "Update project content, case study and gallery.",

          save:
            "Save Project",

          saving:
            "Saving...",

          cancel:
            "Cancel",

          required:
            "Complete all required project and case-study fields.",

          imageRequired:
            "Choose a project image.",

          created:
            "Project created successfully.",

          updated:
            "Project updated successfully.",

          deleted:
            "Project deleted successfully.",

          cover:
            "Project Cover",

          addCover:
            "Add project cover",

          changeCover:
            "Change Cover Image",

          selectCover:
            "Select Cover Image",

          recommended:
            "Recommended landscape image",

          featuredDescription:
            "Highlight this project in the featured portfolio section.",

          howItWorks:
            "How It Works",

          howItWorksDescription:
            "Describe the project workflow or system process as clear steps.",

          addStep:
            "Add Step",

          featuresTitle:
            "Key Features",

          featuresDescription:
            "Add the main features shown on the public project case study.",

          addFeature:
            "Add Feature",

          remove:
            "Remove",

          galleryTitle:
            "Website Screens",

          galleryDescription:
            "Add up to 5 screenshots. Their order here is also used by the public project slider.",

          addGallery:
            "Add Gallery Images",

          noGallery:
            "No gallery images yet",

          noGalleryDescription:
            "The project cover image will be used until you add gallery screenshots.",

          removeImage:
            "Remove Image",

          noProjects:
            "No projects found",

          noProjectsDescription:
            "Try changing your search or create a new portfolio project.",

          footerCreate:
            "Complete the required project information before saving.",

          footerEdit:
            "Saving will update the existing project.",
        };

  /* =======================================================
     LOAD PROJECTS
     ======================================================= */

  useEffect(
    () => {
      let cancelled =
        false;

      async function loadProjects() {
        setLoading(
          true,
        );

        try {
          const result =
            await getAdminProjects(
              language,
            );

          if (
            cancelled
          ) {
            return;
          }

          setProjects(
            sortProjects(
              result,
            ),
          );
        } catch (
          loadError
        ) {
          if (
            cancelled
          ) {
            return;
          }

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load projects.",
          );
        } finally {
          if (
            !cancelled
          ) {
            setLoading(
              false,
            );
          }
        }
      }

      void loadProjects();

      return () => {
        cancelled =
          true;
      };
    },
    [
      language,
    ],
  );

  /* =======================================================
     STATS
     ======================================================= */

  const stats =
    useMemo(
      () => ({
        total:
          projects.length,

        published:
          projects.filter(
            (
              project,
            ) =>
              project.status ===
              "published",
          ).length,

        drafts:
          projects.filter(
            (
              project,
            ) =>
              project.status ===
              "draft",
          ).length,

        featured:
          projects.filter(
            (
              project,
            ) =>
              project.featured,
          ).length,
      }),
      [
        projects,
      ],
    );

  /* =======================================================
     FILTER
     ======================================================= */

  const filteredProjects =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (
          !query
        ) {
          return projects;
        }

        return projects.filter(
          (
            project,
          ) =>
            [
              project.titleEn,
              project.titleAm,
              project.slug,
              project.categoryEn,
              project.categoryAm,
              ...project.technologies,
            ]
              .join(
                " ",
              )
              .toLowerCase()
              .includes(
                query,
              ),
        );
      },
      [
        projects,
        search,
      ],
    );

  /* =======================================================
     FORM UPDATE
     ======================================================= */

  function updateForm<
    Key extends keyof ProjectForm,
  >(
    key:
      Key,

    value:
      ProjectForm[Key],
  ) {
    setForm(
      (
        current,
      ) => ({
        ...current,

        [key]:
          value,
      }),
    );
  }

  /* =======================================================
     OPEN CREATE
     ======================================================= */

  function openCreate() {
    setEditorMode(
      "create",
    );

    setEditorTab(
      "basic",
    );

    setEditingId(
      null,
    );

    setForm(
      createEmptyForm(),
    );

    setSelectedFile(
      null,
    );

    setPreviewUrl(
      "",
    );

    setError(
      "",
    );

    setSuccess(
      "",
    );

    setEditorOpen(
      true,
    );
  }

  /* =======================================================
     OPEN EDIT
     ======================================================= */

  function openEdit(
    project:
      PortfolioProject,
  ) {
    setEditorMode(
      "edit",
    );

    setEditorTab(
      "basic",
    );

    setEditingId(
      project.id,
    );

    setForm(
      projectToForm(
        project,
      ),
    );

    setSelectedFile(
      null,
    );

    setPreviewUrl(
      project.coverImageUrl,
    );

    setError(
      "",
    );

    setSuccess(
      "",
    );

    setEditorOpen(
      true,
    );
  }

  /* =======================================================
     CLOSE EDITOR
     ======================================================= */

  function closeEditor() {
    if (
      previewUrl.startsWith(
        "blob:",
      )
    ) {
      URL.revokeObjectURL(
        previewUrl,
      );
    }

    form.gallery.forEach(
      (
        image,
      ) => {
        if (
          image.previewUrl.startsWith(
            "blob:",
          )
        ) {
          URL.revokeObjectURL(
            image.previewUrl,
          );
        }
      },
    );

    setEditorOpen(
      false,
    );
  }

  /* =======================================================
     COVER IMAGE
     ======================================================= */

  function selectFile(
    file:
      File |
      null,
  ) {
    if (
      !file
    ) {
      return;
    }

    if (
      previewUrl.startsWith(
        "blob:",
      )
    ) {
      URL.revokeObjectURL(
        previewUrl,
      );
    }

    setSelectedFile(
      file,
    );

    setPreviewUrl(
      URL.createObjectURL(
        file,
      ),
    );

    setError(
      "",
    );
  }

  /* =======================================================
     GALLERY
     ======================================================= */

  function addGalleryFiles(
    files:
      FileList |
      null,
  ) {
    if (
      !files
    ) {
      return;
    }

    const availableSlots =
      Math.max(
        0,
        5 -
          form.gallery.length,
      );

    if (
      availableSlots ===
      0
    ) {
      setError(
        "Gallery supports a maximum of 5 images.",
      );

      return;
    }

    const allFiles =
      Array.from(
        files,
      );

    const selected =
      allFiles
        .filter(
          (
            file,
          ) =>
            [
              "image/jpeg",
              "image/png",
              "image/webp",
            ].includes(
              file.type,
            ),
        )
        .slice(
          0,
          availableSlots,
        );

    const newItems:
      GalleryEditorItem[] =
        selected.map(
          (
            file,
          ) => ({
            id:
              crypto.randomUUID(),

            publicId:
              "",

            url:
              "",

            previewUrl:
              URL.createObjectURL(
                file,
              ),

            altEn:
              "",

            altAm:
              "",

            file,
          }),
        );

    updateForm(
      "gallery",
      [
        ...form.gallery,
        ...newItems,
      ],
    );

    if (
      allFiles.length >
      availableSlots
    ) {
      setError(
        "Only the available gallery slots were added. Maximum gallery size is 5.",
      );
    } else {
      setError(
        "",
      );
    }
  }

  function removeGalleryItem(
    index:
      number,
  ) {
    const target =
      form.gallery[
        index
      ];

    if (
      target?.previewUrl.startsWith(
        "blob:",
      )
    ) {
      URL.revokeObjectURL(
        target.previewUrl,
      );
    }

    updateForm(
      "gallery",
      form.gallery.filter(
        (
          _,
          itemIndex,
        ) =>
          itemIndex !==
          index,
      ),
    );
  }

  function moveGalleryItem(
    index:
      number,

    direction:
      -1 |
      1,
  ) {
    const destination =
      index +
      direction;

    if (
      destination <
        0 ||
      destination >=
        form.gallery.length
    ) {
      return;
    }

    const next =
      [
        ...form.gallery,
      ];

    const current =
      next[
        index
      ];

    const other =
      next[
        destination
      ];

    if (
      !current ||
      !other
    ) {
      return;
    }

    next[
      index
    ] =
      other;

    next[
      destination
    ] =
      current;

    updateForm(
      "gallery",
      next,
    );
  }

  function updateGalleryAlt(
    index:
      number,

    languageKey:
      "en" |
      "am",

    value:
      string,
  ) {
    updateForm(
      "gallery",
      form.gallery.map(
        (
          item,
          itemIndex,
        ) => {
          if (
            itemIndex !==
            index
          ) {
            return item;
          }

          if (
            languageKey ===
            "en"
          ) {
            return {
              ...item,

              altEn:
                value,
            };
          }

          return {
            ...item,

            altAm:
              value,
          };
        },
      ),
    );
  }

  /* =======================================================
     HOW IT WORKS
     ======================================================= */

  function addStep() {
    updateForm(
      "howItWorks",
      [
        ...form.howItWorks,

        {
          title: {
            en:
              "",

            am:
              "",
          },

          description: {
            en:
              "",

            am:
              "",
          },
        },
      ],
    );
  }

  function removeStep(
    index:
      number,
  ) {
    updateForm(
      "howItWorks",
      form.howItWorks.filter(
        (
          _,
          itemIndex,
        ) =>
          itemIndex !==
          index,
      ),
    );
  }

  function updateStep(
    index:
      number,

    section:
      "title" |
      "description",

    lang:
      "en" |
      "am",

    value:
      string,
  ) {
    updateForm(
      "howItWorks",
      form.howItWorks.map(
        (
          step,
          itemIndex,
        ) => {
          if (
            itemIndex !==
            index
          ) {
            return step;
          }

          return {
            ...step,

            [section]: {
              ...step[
                section
              ],

              [lang]:
                value,
            },
          };
        },
      ),
    );
  }

  /* =======================================================
     FEATURES
     ======================================================= */

  function addFeature() {
    updateForm(
      "features",
      [
        ...form.features,

        {
          en:
            "",

          am:
            "",
        },
      ],
    );
  }

  function removeFeature(
    index:
      number,
  ) {
    updateForm(
      "features",
      form.features.filter(
        (
          _,
          itemIndex,
        ) =>
          itemIndex !==
          index,
      ),
    );
  }

  function updateFeature(
    index:
      number,

    lang:
      "en" |
      "am",

    value:
      string,
  ) {
    updateForm(
      "features",
      form.features.map(
        (
          feature,
          itemIndex,
        ) =>
          itemIndex ===
          index
            ? {
                ...feature,

                [lang]:
                  value,
              }
            : feature,
      ),
    );
  }

  /* =======================================================
     VALIDATE
     ======================================================= */

  function validateForm() {
    const required =
      [
        form.slug,

        form.titleEn,
        form.titleAm,

        form.categoryEn,
        form.categoryAm,

        form.shortDescriptionEn,
        form.shortDescriptionAm,

        form.descriptionEn,
        form.descriptionAm,

        form.projectYear,

        form.roleEn,
        form.roleAm,

        form.displayStatusEn,
        form.displayStatusAm,

        form.overviewEn,
        form.overviewAm,

        form.challengeEn,
        form.challengeAm,

        form.solutionEn,
        form.solutionAm,
      ];

    if (
      required.some(
        (
          value,
        ) =>
          !value.trim(),
      )
    ) {
      throw new Error(
        copy.required,
      );
    }

    if (
      editorMode ===
        "create" &&
      !selectedFile &&
      !form.coverImagePublicId
    ) {
      throw new Error(
        copy.imageRequired,
      );
    }

    if (
      form.gallery.length >
      5
    ) {
      throw new Error(
        "Gallery can contain a maximum of 5 images.",
      );
    }
  }

  /* =======================================================
     SAVE
     ======================================================= */

  async function saveProject() {
    if (
      saving
    ) {
      return;
    }

    setSaving(
      true,
    );

    setError(
      "",
    );

    try {
      validateForm();

      /* ===================================================
         COVER
         =================================================== */

      let coverPublicId =
        form.coverImagePublicId;

      if (
        selectedFile
      ) {
        const uploaded =
          await uploadProjectImage(
            selectedFile,
            language,
          );

        coverPublicId =
          uploaded.publicId;
      }

      /* ===================================================
         GALLERY
         =================================================== */

      const galleryInput:
        ProjectGalleryInput[] =
        [];

      for (
        const item
        of form.gallery
      ) {
        let publicId =
          item.publicId;

        if (
          item.file
        ) {
          const uploaded =
            await uploadProjectImage(
              item.file,
              language,
            );

          publicId =
            uploaded.publicId;
        }

        if (
          !publicId
        ) {
          continue;
        }

        galleryInput.push({
          publicId,

          altEn:
            item.altEn,

          altAm:
            item.altAm,
        });
      }

      /* ===================================================
         TECHNOLOGIES
         =================================================== */

      const technologies =
        [
          ...new Set(
            form.technologies
              .split(
                ",",
              )
              .map(
                (
                  item,
                ) =>
                  item.trim(),
              )
              .filter(
                Boolean,
              ),
          ),
        ];

      /* ===================================================
         INPUT
         =================================================== */

      const input:
        ProjectInput = {
          slug:
            form.slug,

          titleEn:
            form.titleEn,

          titleAm:
            form.titleAm,

          categoryEn:
            form.categoryEn,

          categoryAm:
            form.categoryAm,

          shortDescriptionEn:
            form.shortDescriptionEn,

          shortDescriptionAm:
            form.shortDescriptionAm,

          descriptionEn:
            form.descriptionEn,

          descriptionAm:
            form.descriptionAm,

          technologies,

          coverImagePublicId:
            coverPublicId,

          liveUrl:
            form.liveUrl,

          status:
            form.status,

          featured:
            form.featured,

          sortOrder:
            form.sortOrder,

          projectYear:
            form.projectYear,

          roleEn:
            form.roleEn,

          roleAm:
            form.roleAm,

          displayStatusEn:
            form.displayStatusEn,

          displayStatusAm:
            form.displayStatusAm,

          overviewEn:
            form.overviewEn,

          overviewAm:
            form.overviewAm,

          challengeEn:
            form.challengeEn,

          challengeAm:
            form.challengeAm,

          solutionEn:
            form.solutionEn,

          solutionAm:
            form.solutionAm,

          howItWorks:
            form.howItWorks,

          features:
            form.features,

          gallery:
            galleryInput,
        };

      /* ===================================================
         CREATE
         =================================================== */

      if (
        editorMode ===
        "create"
      ) {
        const created =
          await createProject(
            input,
            language,
          );

        setProjects(
          (
            current,
          ) =>
            sortProjects([
              ...current,
              created,
            ]),
        );

        setSuccess(
          copy.created,
        );
      } else {
        /* =================================================
           UPDATE
           ================================================= */

        if (
          !editingId
        ) {
          throw new Error(
            "Missing project id.",
          );
        }

        const updated =
          await updateProject(
            editingId,
            input,
            language,
          );

        setProjects(
          (
            current,
          ) =>
            sortProjects(
              current.map(
                (
                  project,
                ) =>
                  project.id ===
                  updated.id
                    ? updated
                    : project,
              ),
            ),
        );

        setSuccess(
          copy.updated,
        );
      }

      closeEditor();
    } catch (
      saveError
    ) {
      setError(
        saveError instanceof
          Error
          ? saveError.message
          : "Unable to save project.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  /* =======================================================
     DELETE
     ======================================================= */

  async function handleDelete(
    project:
      PortfolioProject,
  ) {
    if (
      !window.confirm(
        `Delete ${project.titleEn}?`,
      )
    ) {
      return;
    }

    try {
      await deleteProject(
        project.id,
        language,
      );

      setProjects(
        (
          current,
        ) =>
          current.filter(
            (
              item,
            ) =>
              item.id !==
              project.id,
          ),
      );

      setSuccess(
        copy.deleted,
      );

      setError(
        "",
      );
    } catch (
      deleteError
    ) {
      setError(
        deleteError instanceof
          Error
          ? deleteError.message
          : "Unable to delete project.",
      );
    }
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <AdminShell>
      {/* ===================================================
          LOCAL ADMIN PROJECT STYLES
          =================================================== */}

      <style>
        {`
          .admin-project-input {
            display: block;
            width: 100%;
            min-width: 0;
            min-height: 46px;

            border: 1px solid rgba(27, 34, 23, 0.09);
            border-radius: 13px;

            background: #ffffff;

            padding: 0 14px;

            color: #20251d;

            font-family: inherit;
            font-size: 10px;
            font-weight: 500;

            outline: none;

            box-shadow:
              0 1px 2px rgba(24, 33, 19, 0.018),
              0 5px 18px rgba(34, 52, 25, 0.022);

            transition:
              border-color 180ms ease,
              background-color 180ms ease,
              box-shadow 180ms ease;
          }

          .admin-project-input::placeholder {
            color: rgba(26, 32, 22, 0.25);
            font-weight: 450;
          }

          .admin-project-input:hover {
            border-color: rgba(66, 108, 43, 0.2);
          }

          .admin-project-input:focus {
            border-color: rgba(66, 108, 43, 0.45);

            background: #ffffff;

            box-shadow:
              0 0 0 4px rgba(110, 154, 79, 0.08),
              0 6px 22px rgba(38, 61, 27, 0.04);
          }

          .admin-project-input:disabled {
            cursor: not-allowed;
            opacity: 0.55;
          }

          textarea.admin-project-input {
            min-height: 105px;

            padding-top: 12px;
            padding-bottom: 12px;

            line-height: 1.65;

            resize: vertical;
          }

          select.admin-project-input {
            cursor: pointer;
            padding-right: 38px;
          }

          input[type="number"].admin-project-input {
            font-variant-numeric: tabular-nums;
          }

          .admin-project-editor-body {
            scrollbar-width: thin;
            scrollbar-color:
              rgba(66, 108, 43, 0.24)
              transparent;
          }

          .admin-project-editor-body::-webkit-scrollbar {
            width: 7px;
          }

          .admin-project-editor-body::-webkit-scrollbar-track {
            background: transparent;
          }

          .admin-project-editor-body::-webkit-scrollbar-thumb {
            border-radius: 999px;
            background: rgba(66, 108, 43, 0.19);
          }

          .admin-project-editor-body::-webkit-scrollbar-thumb:hover {
            background: rgba(66, 108, 43, 0.32);
          }

          .admin-project-tabs {
            scrollbar-width: none;
          }

          .admin-project-tabs::-webkit-scrollbar {
            display: none;
          }

          @media (max-width: 640px) {
            .admin-project-input {
              min-height: 48px;
              font-size: 12px;
            }

            textarea.admin-project-input {
              min-height: 115px;
            }
          }
        `}
      </style>

      {/* ===================================================
          PAGE
          =================================================== */}

      <section>
        {/* =================================================
            HEADER
            ================================================= */}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-[8px] font-extrabold uppercase tracking-[0.18em] text-[#609341]">
              {
                copy.eyebrow
              }
            </span>

            <h2 className="mt-3 text-[30px] font-black tracking-[-0.05em] text-[#151913]">
              {
                copy.title
              }
            </h2>

            <p className="mt-2 max-w-[600px] text-[9px] leading-5 text-black/35">
              {
                copy.description
              }
            </p>
          </div>

          <button
            type="button"
            onClick={
              openCreate
            }
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#426c2b] px-5 text-[9px] font-bold text-white shadow-[0_12px_30px_rgba(66,108,43,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#355923]"
          >
            <span className="h-4 w-4">
              <PlusIcon />
            </span>

            {
              copy.add
            }
          </button>
        </div>

        {/* =================================================
            MESSAGES
            ================================================= */}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[9px] font-medium text-red-600"
          >
            {
              error
            }
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-xl border border-[#7bad56]/20 bg-[#edf5e7] px-4 py-3 text-[9px] font-medium text-[#426c2b]">
            {
              success
            }
          </div>
        )}

        {/* =================================================
            STATS
            ================================================= */}

        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label:
                copy.total,

              value:
                stats.total,
            },

            {
              label:
                copy.published,

              value:
                stats.published,
            },

            {
              label:
                copy.drafts,

              value:
                stats.drafts,
            },

            {
              label:
                copy.featured,

              value:
                stats.featured,
            },
          ].map(
            (
              item,
            ) => (
              <div
                key={
                  item.label
                }
                className="rounded-2xl border border-black/[0.055] bg-white p-5 shadow-[0_6px_25px_rgba(30,45,22,0.02)]"
              >
                <span className="text-[7px] font-semibold text-black/30">
                  {
                    item.label
                  }
                </span>

                <strong className="mt-3 block text-[22px] font-black tracking-[-0.04em] text-[#20251d]">
                  {
                    item.value
                  }
                </strong>
              </div>
            ),
          )}
        </div>

        {/* =================================================
            PROJECT LIST
            ================================================= */}

        <div className="mt-5 overflow-hidden rounded-2xl border border-black/[0.055] bg-white shadow-[0_8px_30px_rgba(30,45,22,0.025)]">
          {/* SEARCH */}

          <div className="border-b border-black/[0.055] p-4">
            <input
              type="search"
              value={
                search
              }
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target
                    .value,
                )
              }
              placeholder={
                copy.search
              }
              className="admin-project-input max-w-[380px]"
            />
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-t-[#426c2b]" />
            </div>
          ) : filteredProjects.length ===
            0 ? (
            /* EMPTY */

            <div className="flex min-h-[260px] items-center justify-center px-6 py-10 text-center">
              <div>
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef5e8] text-[#426c2b]">
                  <span className="h-5 w-5">
                    <ImageIcon />
                  </span>
                </span>

                <strong className="mt-4 block text-[11px] font-black text-[#252a22]">
                  {
                    copy.noProjects
                  }
                </strong>

                <p className="mx-auto mt-2 max-w-[280px] text-[8px] leading-5 text-black/30">
                  {
                    copy.noProjectsDescription
                  }
                </p>
              </div>
            </div>
          ) : (
            /* PROJECTS */

            filteredProjects.map(
              (
                project,
              ) => (
                <div
                  key={
                    project.id
                  }
                  className="flex flex-col gap-4 border-b border-black/[0.05] p-4 transition-colors hover:bg-[#fafcf8] last:border-0 sm:flex-row sm:items-center"
                >
                  <img
                    src={
                      project.coverImageUrl
                    }
                    alt={
                      project.titleEn
                    }
                    className="h-[82px] w-full rounded-xl object-cover sm:h-[72px] sm:w-[120px]"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="truncate text-[11px] font-black text-[#252a22]">
                        {
                          project.titleEn
                        }
                      </strong>

                      <span className="rounded-full bg-[#edf5e7] px-2.5 py-1 text-[6px] font-bold uppercase tracking-[0.08em] text-[#426c2b]">
                        {
                          project.status
                        }
                      </span>

                      {project.featured && (
                        <span className="rounded-full bg-[#eff7d7] px-2.5 py-1 text-[6px] font-bold uppercase tracking-[0.08em] text-[#688d32]">
                          FEATURED
                        </span>
                      )}

                      {project.gallery.length >
                        0 && (
                        <span className="rounded-full bg-[#f2f4ef] px-2.5 py-1 text-[6px] font-medium text-black/40">
                          {project.gallery.length} gallery
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[7.5px] text-black/30">
                      <span>
                        /
                        {
                          project.slug
                        }
                      </span>

                      {project.categoryEn && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-black/15" />

                          <span>
                            {
                              project.categoryEn
                            }
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openEdit(
                          project,
                        )
                      }
                      className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl border border-black/[0.07] bg-white px-3 text-[8px] font-bold text-black/55 transition hover:border-black/[0.12] hover:bg-[#f8faf6] sm:flex-none"
                    >
                      <span className="h-3.5 w-3.5">
                        <EditIcon />
                      </span>

                      {
                        copy.edit
                      }
                    </button>

                    <button
                      type="button"
                      aria-label={`Delete ${project.titleEn}`}
                      onClick={() =>
                        void handleDelete(
                          project,
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-white text-red-500 transition hover:bg-red-50"
                    >
                      <span className="h-3.5 w-3.5">
                        <TrashIcon />
                      </span>
                    </button>
                  </div>
                </div>
              ),
            )
          )}
        </div>
      </section>

      {/* ===================================================
          EDITOR
          =================================================== */}

      {editorOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-[#11150f]/35 backdrop-blur-[4px]">
          {/* BACKDROP */}

          <button
            type="button"
            aria-label="Close editor"
            onClick={
              closeEditor
            }
            className="absolute inset-0"
          />

          {/* DRAWER */}

          <div className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-[#f8faf5] shadow-[-30px_0_90px_rgba(20,30,15,0.16)] sm:my-3 sm:mr-3 sm:h-[calc(100%-24px)] sm:max-w-[820px] sm:rounded-[26px] sm:border sm:border-black/[0.055]">
            {/* =============================================
                EDITOR HEADER
                ============================================= */}

            <div className="flex shrink-0 items-center justify-between border-b border-black/[0.055] bg-white/95 px-5 py-5 backdrop-blur-xl sm:px-7 sm:py-6">
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8bc84f] shadow-[0_0_0_4px_rgba(139,200,79,0.1)]" />

                  <span className="text-[7px] font-extrabold uppercase tracking-[0.18em] text-[#638d46]">
                    PROJECT EDITOR
                  </span>
                </div>

                <h3 className="mt-2 text-[22px] font-black tracking-[-0.045em] text-[#191d17] sm:text-[24px]">
                  {editorMode ===
                  "create"
                    ? copy.createTitle
                    : copy.editTitle}
                </h3>

                <p className="mt-1.5 text-[8px] leading-5 text-black/35">
                  {editorMode ===
                  "create"
                    ? copy.createDescription
                    : copy.editDescription}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeEditor
                }
                aria-label="Close project editor"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/[0.07] bg-[#fafbf8] text-black/55 transition-all duration-200 hover:border-black/[0.12] hover:bg-white hover:text-black"
              >
                <span className="h-4 w-4">
                  <CloseIcon />
                </span>
              </button>
            </div>

            {/* =============================================
                TABS
                ============================================= */}

            <div className="shrink-0 border-b border-black/[0.055] bg-white px-5 py-3 sm:px-7">
              <div className="admin-project-tabs flex w-fit max-w-full gap-1 overflow-x-auto rounded-[14px] bg-[#f3f6f0] p-1">
                {[
                  {
                    id:
                      "basic" as
                        EditorTab,

                    label:
                      copy.basic,
                  },

                  {
                    id:
                      "case-study" as
                        EditorTab,

                    label:
                      copy.caseStudy,
                  },

                  {
                    id:
                      "gallery" as
                        EditorTab,

                    label:
                      `${copy.gallery} (${form.gallery.length}/5)`,
                  },
                ].map(
                  (
                    tab,
                  ) => (
                    <button
                      key={
                        tab.id
                      }
                      type="button"
                      onClick={() =>
                        setEditorTab(
                          tab.id,
                        )
                      }
                      className={`whitespace-nowrap rounded-[10px] px-4 py-2.5 text-[8px] font-extrabold transition-all duration-200 ${
                        editorTab ===
                        tab.id
                          ? "bg-white text-[#426c2b] shadow-[0_3px_12px_rgba(39,57,29,0.07)]"
                          : "text-black/35 hover:text-black/60"
                      }`}
                    >
                      {
                        tab.label
                      }
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* =============================================
                BODY
                ============================================= */}

            <div className="admin-project-editor-body min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
              <div className="mx-auto w-full max-w-[750px]">
                {/* =========================================
                    BASIC
                    ========================================= */}

                {editorTab ===
                  "basic" && (
                  <div className="space-y-5">
                    {/* COVER */}

                    <EditorSection
                      eyebrow="MEDIA"
                      title={
                        copy.cover
                      }
                    >
                      <label className="group block cursor-pointer overflow-hidden rounded-[20px] border border-black/[0.07] bg-white shadow-[0_8px_30px_rgba(30,45,22,0.035)] transition-all duration-300 hover:border-[#6f9e50]/25 hover:shadow-[0_12px_35px_rgba(30,45,22,0.055)]">
                        <div className="relative h-[190px] overflow-hidden bg-[#f2f5ef] sm:h-[235px]">
                          {previewUrl ? (
                            <>
                              <img
                                src={
                                  previewUrl
                                }
                                alt="Cover preview"
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.015]"
                              />

                              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                              <div className="absolute bottom-3 left-3 rounded-full border border-white/30 bg-black/45 px-3 py-1.5 text-[7px] font-bold text-white backdrop-blur-md">
                                {
                                  copy.changeCover
                                }
                              </div>
                            </>
                          ) : (
                            <div className="flex h-full flex-col items-center justify-center px-5 text-center">
                              <span className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#709850]/10 bg-[#eaf3e4] text-[#426c2b]">
                                <span className="h-5 w-5">
                                  <ImageIcon />
                                </span>
                              </span>

                              <strong className="mt-4 text-[10px] font-extrabold text-[#252a22]">
                                {
                                  copy.addCover
                                }
                              </strong>

                              <span className="mt-1.5 text-[8px] text-black/30">
                                JPG, PNG or WEBP
                              </span>
                            </div>
                          )}
                        </div>

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(
                            event,
                          ) =>
                            selectFile(
                              event
                                .target
                                .files?.[0] ??
                                null,
                            )
                          }
                        />

                        <div className="flex items-center justify-between border-t border-black/[0.05] px-4 py-3.5">
                          <div>
                            <span className="block text-[8px] font-extrabold text-[#426c2b]">
                              {previewUrl
                                ? copy.changeCover
                                : copy.selectCover}
                            </span>

                            <span className="mt-0.5 block text-[7px] text-black/25">
                              {
                                copy.recommended
                              }
                            </span>
                          </div>

                          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#f1f6ed] text-[#426c2b] transition-transform duration-300 group-hover:translate-x-0.5">
                            <span className="h-4 w-4">
                              <RightIcon />
                            </span>
                          </span>
                        </div>
                      </label>
                    </EditorSection>

                    {/* PROJECT INFO */}

                    <EditorSection
                      eyebrow="CONTENT"
                      title="Project Information"
                      description="Main public information used across the portfolio project cards and detail page."
                    >
                      <div className="grid gap-x-4 gap-y-5 lg:grid-cols-2">
                        <Field label="Title EN">
                          <input
                            value={
                              form.titleEn
                            }
                            onChange={(
                              event,
                            ) => {
                              const value =
                                event
                                  .target
                                  .value;

                              updateForm(
                                "titleEn",
                                value,
                              );

                              if (
                                editorMode ===
                                "create"
                              ) {
                                updateForm(
                                  "slug",
                                  slugify(
                                    value,
                                  ),
                                );
                              }
                            }}
                            placeholder="Project title"
                            className="admin-project-input"
                          />
                        </Field>

                        <Field label="Title AM">
                          <input
                            value={
                              form.titleAm
                            }
                            onChange={(
                              event,
                            ) =>
                              updateForm(
                                "titleAm",
                                event
                                  .target
                                  .value,
                              )
                            }
                            placeholder="የፕሮጀክት ስም"
                            className="admin-project-input"
                          />
                        </Field>

                        <Field label="Slug">
                          <input
                            value={
                              form.slug
                            }
                            onChange={(
                              event,
                            ) =>
                              updateForm(
                                "slug",
                                slugify(
                                  event
                                    .target
                                    .value,
                                ),
                              )
                            }
                            placeholder="project-name"
                            className="admin-project-input"
                          />
                        </Field>

                        <Field label="Live URL">
                          <input
                            type="url"
                            value={
                              form.liveUrl
                            }
                            onChange={(
                              event,
                            ) =>
                              updateForm(
                                "liveUrl",
                                event
                                  .target
                                  .value,
                              )
                            }
                            placeholder="https://..."
                            className="admin-project-input"
                          />
                        </Field>

                        <Field label="Category EN">
                          <input
                            value={
                              form.categoryEn
                            }
                            onChange={(
                              event,
                            ) =>
                              updateForm(
                                "categoryEn",
                                event
                                  .target
                                  .value,
                              )
                            }
                            placeholder="Full-Stack Platform"
                            className="admin-project-input"
                          />
                        </Field>

                        <Field label="Category AM">
                          <input
                            value={
                              form.categoryAm
                            }
                            onChange={(
                              event,
                            ) =>
                              updateForm(
                                "categoryAm",
                                event
                                  .target
                                  .value,
                              )
                            }
                            className="admin-project-input"
                          />
                        </Field>

                        <Field
                          label="Short Description EN"
                          full
                        >
                          <textarea
                            value={
                              form.shortDescriptionEn
                            }
                            onChange={(
                              event,
                            ) =>
                              updateForm(
                                "shortDescriptionEn",
                                event
                                  .target
                                  .value,
                              )
                            }
                            rows={
                              3
                            }
                            placeholder="Short summary used on project cards..."
                            className="admin-project-input"
                          />
                        </Field>

                        <Field
                          label="Short Description AM"
                          full
                        >
                          <textarea
                            value={
                              form.shortDescriptionAm
                            }
                            onChange={(
                              event,
                            ) =>
                              updateForm(
                                "shortDescriptionAm",
                                event
                                  .target
                                  .value,
                              )
                            }
                            rows={
                              3
                            }
                            className="admin-project-input"
                          />
                        </Field>

                        <Field
                          label="Description EN"
                          full
                        >
                          <textarea
                            value={
                              form.descriptionEn
                            }
                            onChange={(
                              event,
                            ) =>
                              updateForm(
                                "descriptionEn",
                                event
                                  .target
                                  .value,
                              )
                            }
                            rows={
                              5
                            }
                            placeholder="Full project description..."
                            className="admin-project-input"
                          />
                        </Field>

                        <Field
                          label="Description AM"
                          full
                        >
                          <textarea
                            value={
                              form.descriptionAm
                            }
                            onChange={(
                              event,
                            ) =>
                              updateForm(
                                "descriptionAm",
                                event
                                  .target
                                  .value,
                              )
                            }
                            rows={
                              5
                            }
                            className="admin-project-input"
                          />
                        </Field>

                        <Field
                          label="Technologies"
                          full
                        >
                          <input
                            value={
                              form.technologies
                            }
                            onChange={(
                              event,
                            ) =>
                              updateForm(
                                "technologies",
                                event
                                  .target
                                  .value,
                              )
                            }
                            placeholder="Next.js, TypeScript, PostgreSQL"
                            className="admin-project-input"
                          />
                        </Field>
                      </div>
                    </EditorSection>

                    {/* PUBLISHING */}

                    <EditorSection
                      eyebrow="PUBLISHING"
                      title="Display Settings"
                      description="Control publication, ordering and whether this project appears as featured."
                    >
                      <div className="grid gap-x-4 gap-y-5 lg:grid-cols-2">
                        <Field label="Status">
                          <select
                            value={
                              form.status
                            }
                            onChange={(
                              event,
                            ) =>
                              updateForm(
                                "status",
                                event
                                  .target
                                  .value as
                                  ProjectStatus,
                              )
                            }
                            className="admin-project-input"
                          >
                            <option value="draft">
                              Draft
                            </option>

                            <option value="published">
                              Published
                            </option>
                          </select>
                        </Field>

                        <Field label="Sort Order">
                          <input
                            type="number"
                            min={
                              0
                            }
                            value={
                              form.sortOrder
                            }
                            onChange={(
                              event,
                            ) =>
                              updateForm(
                                "sortOrder",
                                Number(
                                  event
                                    .target
                                    .value,
                                ),
                              )
                            }
                            className="admin-project-input"
                          />
                        </Field>

                        <div className="lg:col-span-2">
                          <label className="flex cursor-pointer items-center justify-between rounded-[16px] border border-black/[0.07] bg-[#fafbf8] px-4 py-4">
                            <div className="pr-4">
                              <span className="block text-[9px] font-extrabold text-[#252a22]">
                                Featured Project
                              </span>

                              <span className="mt-1 block text-[7.5px] leading-4 text-black/30">
                                {
                                  copy.featuredDescription
                                }
                              </span>
                            </div>

                            <input
                              type="checkbox"
                              checked={
                                form.featured
                              }
                              onChange={(
                                event,
                              ) =>
                                updateForm(
                                  "featured",
                                  event
                                    .target
                                    .checked,
                                )
                              }
                              className="peer sr-only"
                            />

                            <span className="relative h-[24px] w-[42px] shrink-0 rounded-full bg-black/10 transition-colors duration-200 peer-checked:bg-[#426c2b]">
                              <span className="absolute left-[3px] top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-[18px]" />
                            </span>
                          </label>
                        </div>
                      </div>
                    </EditorSection>
                  </div>
                )}

                {/* =========================================
                    CASE STUDY
                    ========================================= */}

                {editorTab ===
                  "case-study" && (
                  <div className="space-y-5">
                    {/* META */}

                    <EditorSection
                      eyebrow="CASE STUDY"
                      title="Project Details"
                      description="Information displayed near the top of the full project case study."
                    >
                      <div className="grid gap-x-4 gap-y-5 lg:grid-cols-2">
                        <Field label="Year">
                          <input
                            value={
                              form.projectYear
                            }
                            onChange={(
                              event,
                            ) =>
                              updateForm(
                                "projectYear",
                                event
                                  .target
                                  .value,
                              )
                            }
                            placeholder="2026"
                            className="admin-project-input"
                          />
                        </Field>

                        <Field label="Display Status EN">
                          <input
                            value={
                              form.displayStatusEn
                            }
                            onChange={(
                              event,
                            ) =>
                              updateForm(
                                "displayStatusEn",
                                event
                                  .target
                                  .value,
                              )
                            }
                            placeholder="Completed"
                            className="admin-project-input"
                          />
                        </Field>

                        <Field label="Role EN">
                          <input
                            value={
                              form.roleEn
                            }
                            onChange={(
                              event,
                            ) =>
                              updateForm(
                                "roleEn",
                                event
                                  .target
                                  .value,
                              )
                            }
                            placeholder="Full-Stack Development"
                            className="admin-project-input"
                          />
                        </Field>

                        <Field label="Role AM">
                          <input
                            value={
                              form.roleAm
                            }
                            onChange={(
                              event,
                            ) =>
                              updateForm(
                                "roleAm",
                                event
                                  .target
                                  .value,
                              )
                            }
                            className="admin-project-input"
                          />
                        </Field>

                        <Field
                          label="Display Status AM"
                          full
                        >
                          <input
                            value={
                              form.displayStatusAm
                            }
                            onChange={(
                              event,
                            ) =>
                              updateForm(
                                "displayStatusAm",
                                event
                                  .target
                                  .value,
                              )
                            }
                            className="admin-project-input"
                          />
                        </Field>
                      </div>
                    </EditorSection>

                    {/* STORY */}

                    <EditorSection
                      eyebrow="STORY"
                      title="Overview, Challenge & Solution"
                      description="Write the main project story in both English and Amharic."
                    >
                      <div className="grid gap-x-4 gap-y-5 lg:grid-cols-2">
                        {[
                          {
                            label:
                              "Overview EN",

                            field:
                              "overviewEn" as const,
                          },

                          {
                            label:
                              "Overview AM",

                            field:
                              "overviewAm" as const,
                          },

                          {
                            label:
                              "Challenge EN",

                            field:
                              "challengeEn" as const,
                          },

                          {
                            label:
                              "Challenge AM",

                            field:
                              "challengeAm" as const,
                          },

                          {
                            label:
                              "Solution EN",

                            field:
                              "solutionEn" as const,
                          },

                          {
                            label:
                              "Solution AM",

                            field:
                              "solutionAm" as const,
                          },
                        ].map(
                          (
                            item,
                          ) => (
                            <Field
                              key={
                                item.field
                              }
                              label={
                                item.label
                              }
                              full
                            >
                              <textarea
                                value={
                                  form[
                                    item.field
                                  ]
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateForm(
                                    item.field,
                                    event
                                      .target
                                      .value,
                                  )
                                }
                                rows={
                                  5
                                }
                                className="admin-project-input"
                              />
                            </Field>
                          ),
                        )}
                      </div>
                    </EditorSection>

                    {/* HOW IT WORKS */}

                    <EditorSection
                      eyebrow="PROCESS"
                      title={
                        copy.howItWorks
                      }
                      description={
                        copy.howItWorksDescription
                      }
                      action={
                        <button
                          type="button"
                          onClick={
                            addStep
                          }
                          className="flex h-9 shrink-0 items-center gap-2 rounded-xl bg-[#edf5e7] px-4 text-[8px] font-extrabold text-[#426c2b] transition hover:bg-[#e6f1de]"
                        >
                          <span className="h-3.5 w-3.5">
                            <PlusIcon />
                          </span>

                          {
                            copy.addStep
                          }
                        </button>
                      }
                    >
                      {form.howItWorks.length ===
                      0 ? (
                        <div className="rounded-xl border border-dashed border-black/[0.08] bg-[#fafbf8] px-5 py-8 text-center text-[8px] text-black/30">
                          No steps added yet.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {form.howItWorks.map(
                            (
                              step,
                              index,
                            ) => (
                              <div
                                key={
                                  index
                                }
                                className="rounded-[16px] border border-black/[0.06] bg-[#fafbf8] p-4"
                              >
                                <div className="mb-4 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-6 min-w-6 items-center justify-center rounded-lg bg-[#eaf3e4] px-2 text-[7px] font-black text-[#426c2b]">
                                      {String(
                                        index +
                                          1,
                                      ).padStart(
                                        2,
                                        "0",
                                      )}
                                    </span>

                                    <strong className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#426c2b]">
                                      STEP
                                    </strong>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeStep(
                                        index,
                                      )
                                    }
                                    className="text-[8px] font-bold text-red-500 transition hover:text-red-600"
                                  >
                                    {
                                      copy.remove
                                    }
                                  </button>
                                </div>

                                <div className="grid gap-3 lg:grid-cols-2">
                                  <input
                                    value={
                                      step
                                        .title
                                        .en
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      updateStep(
                                        index,
                                        "title",
                                        "en",
                                        event
                                          .target
                                          .value,
                                      )
                                    }
                                    placeholder="Title EN"
                                    className="admin-project-input"
                                  />

                                  <input
                                    value={
                                      step
                                        .title
                                        .am
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      updateStep(
                                        index,
                                        "title",
                                        "am",
                                        event
                                          .target
                                          .value,
                                      )
                                    }
                                    placeholder="Title AM"
                                    className="admin-project-input"
                                  />

                                  <textarea
                                    value={
                                      step
                                        .description
                                        .en
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      updateStep(
                                        index,
                                        "description",
                                        "en",
                                        event
                                          .target
                                          .value,
                                      )
                                    }
                                    placeholder="Description EN"
                                    rows={
                                      3
                                    }
                                    className="admin-project-input"
                                  />

                                  <textarea
                                    value={
                                      step
                                        .description
                                        .am
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      updateStep(
                                        index,
                                        "description",
                                        "am",
                                        event
                                          .target
                                          .value,
                                      )
                                    }
                                    placeholder="Description AM"
                                    rows={
                                      3
                                    }
                                    className="admin-project-input"
                                  />
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </EditorSection>

                    {/* FEATURES */}

                    <EditorSection
                      eyebrow="FEATURES"
                      title={
                        copy.featuresTitle
                      }
                      description={
                        copy.featuresDescription
                      }
                      action={
                        <button
                          type="button"
                          onClick={
                            addFeature
                          }
                          className="flex h-9 shrink-0 items-center gap-2 rounded-xl bg-[#edf5e7] px-4 text-[8px] font-extrabold text-[#426c2b] transition hover:bg-[#e6f1de]"
                        >
                          <span className="h-3.5 w-3.5">
                            <PlusIcon />
                          </span>

                          {
                            copy.addFeature
                          }
                        </button>
                      }
                    >
                      {form.features.length ===
                      0 ? (
                        <div className="rounded-xl border border-dashed border-black/[0.08] bg-[#fafbf8] px-5 py-8 text-center text-[8px] text-black/30">
                          No features added yet.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {form.features.map(
                            (
                              feature,
                              index,
                            ) => (
                              <div
                                key={
                                  index
                                }
                                className="rounded-[16px] border border-black/[0.06] bg-[#fafbf8] p-4"
                              >
                                <div className="mb-3 flex items-center justify-between">
                                  <span className="text-[7px] font-extrabold uppercase tracking-[0.12em] text-black/30">
                                    Feature{" "}
                                    {
                                      index +
                                      1
                                    }
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeFeature(
                                        index,
                                      )
                                    }
                                    className="text-[8px] font-bold text-red-500 transition hover:text-red-600"
                                  >
                                    {
                                      copy.remove
                                    }
                                  </button>
                                </div>

                                <div className="grid gap-3 lg:grid-cols-2">
                                  <input
                                    value={
                                      feature.en
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      updateFeature(
                                        index,
                                        "en",
                                        event
                                          .target
                                          .value,
                                      )
                                    }
                                    placeholder="Feature EN"
                                    className="admin-project-input"
                                  />

                                  <input
                                    value={
                                      feature.am
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      updateFeature(
                                        index,
                                        "am",
                                        event
                                          .target
                                          .value,
                                      )
                                    }
                                    placeholder="Feature AM"
                                    className="admin-project-input"
                                  />
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </EditorSection>
                  </div>
                )}

                {/* =========================================
                    GALLERY
                    ========================================= */}

                {editorTab ===
                  "gallery" && (
                  <div>
                    <EditorSection
                      eyebrow="PROJECT GALLERY"
                      title={
                        copy.galleryTitle
                      }
                      description={
                        copy.galleryDescription
                      }
                      action={
                        <div className="flex h-10 shrink-0 items-center rounded-xl bg-[#f3f7ef] px-4 text-[9px] font-black text-[#426c2b]">
                          {
                            form.gallery.length
                          }
                          /5
                        </div>
                      }
                    >
                      {form.gallery.length <
                        5 && (
                        <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-[#5f8f3f]/25 bg-[#f8fbf6] px-5 py-8 transition hover:border-[#5f8f3f]/45 hover:bg-[#f3f8ef]">
                          <div className="text-center">
                            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf3e4] text-[#426c2b]">
                              <span className="h-5 w-5">
                                <PlusIcon />
                              </span>
                            </span>

                            <strong className="mt-3 block text-[9px] font-extrabold text-[#22271f]">
                              {
                                copy.addGallery
                              }
                            </strong>

                            <span className="mt-1 block text-[7.5px] text-black/30">
                              JPG, PNG or WEBP · maximum 5
                            </span>
                          </div>

                          <input
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(
                              event,
                            ) => {
                              addGalleryFiles(
                                event
                                  .target
                                  .files,
                              );

                              event.target.value =
                                "";
                            }}
                          />
                        </label>
                      )}
                    </EditorSection>

                    {/* GALLERY ITEMS */}

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      {form.gallery.map(
                        (
                          image,
                          index,
                        ) => (
                          <article
                            key={
                              image.id
                            }
                            className="overflow-hidden rounded-[20px] border border-black/[0.06] bg-white shadow-[0_8px_30px_rgba(28,40,21,0.035)]"
                          >
                            <div className="relative aspect-[16/9] overflow-hidden bg-[#eef1ea]">
                              <img
                                src={
                                  image.previewUrl
                                }
                                alt=""
                                className="h-full w-full object-cover"
                              />

                              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1.5 text-[7px] font-black text-[#426c2b] shadow-sm backdrop-blur">
                                {String(
                                  index +
                                    1,
                                ).padStart(
                                  2,
                                  "0",
                                )}
                              </span>

                              <div className="absolute bottom-3 right-3 flex gap-1.5">
                                <button
                                  type="button"
                                  aria-label="Move image left"
                                  disabled={
                                    index ===
                                    0
                                  }
                                  onClick={() =>
                                    moveGalleryItem(
                                      index,
                                      -1,
                                    )
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-[#426c2b] shadow-sm backdrop-blur transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                  <span className="h-4 w-4">
                                    <LeftIcon />
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  aria-label="Move image right"
                                  disabled={
                                    index ===
                                    form.gallery
                                      .length -
                                      1
                                  }
                                  onClick={() =>
                                    moveGalleryItem(
                                      index,
                                      1,
                                    )
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-[#426c2b] shadow-sm backdrop-blur transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                  <span className="h-4 w-4">
                                    <RightIcon />
                                  </span>
                                </button>
                              </div>
                            </div>

                            <div className="p-4">
                              <div className="grid gap-3">
                                <input
                                  value={
                                    image.altEn
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updateGalleryAlt(
                                      index,
                                      "en",
                                      event
                                        .target
                                        .value,
                                    )
                                  }
                                  placeholder="Image description EN — optional"
                                  className="admin-project-input"
                                />

                                <input
                                  value={
                                    image.altAm
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updateGalleryAlt(
                                      index,
                                      "am",
                                      event
                                        .target
                                        .value,
                                    )
                                  }
                                  placeholder="Image description AM — optional"
                                  className="admin-project-input"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeGalleryItem(
                                    index,
                                  )
                                }
                                className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-red-100 text-[8px] font-bold text-red-500 transition hover:bg-red-50"
                              >
                                <span className="h-3.5 w-3.5">
                                  <TrashIcon />
                                </span>

                                {
                                  copy.removeImage
                                }
                              </button>
                            </div>
                          </article>
                        ),
                      )}
                    </div>

                    {/* EMPTY GALLERY */}

                    {form.gallery.length ===
                      0 && (
                      <div className="mt-5 flex min-h-[180px] items-center justify-center rounded-[20px] border border-dashed border-black/[0.08] bg-white text-center">
                        <div className="px-6">
                          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef5e8] text-[#426c2b]">
                            <span className="h-4 w-4">
                              <ImageIcon />
                            </span>
                          </span>

                          <span className="mt-3 block text-[9px] font-bold text-black/40">
                            {
                              copy.noGallery
                            }
                          </span>

                          <p className="mx-auto mt-1 max-w-[340px] text-[7.5px] leading-4 text-black/25">
                            {
                              copy.noGalleryDescription
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* =============================================
                FOOTER
                ============================================= */}

            <div className="shrink-0 border-t border-black/[0.055] bg-white/95 px-4 py-4 backdrop-blur-xl sm:px-7">
              <div className="mx-auto flex w-full max-w-[750px] items-center justify-between gap-3">
                <span className="hidden max-w-[340px] text-[7.5px] leading-4 text-black/30 sm:block">
                  {editorMode ===
                  "create"
                    ? copy.footerCreate
                    : copy.footerEdit}
                </span>

                <div className="ml-auto flex w-full items-center gap-2 sm:w-auto">
                  <button
                    type="button"
                    onClick={
                      closeEditor
                    }
                    disabled={
                      saving
                    }
                    className="h-11 flex-1 rounded-xl border border-black/[0.07] bg-white px-5 text-[8px] font-extrabold text-black/45 transition-all duration-200 hover:border-black/[0.12] hover:bg-[#f8faf6] hover:text-black/65 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                  >
                    {
                      copy.cancel
                    }
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void saveProject()
                    }
                    disabled={
                      saving
                    }
                    className="flex h-11 min-w-[125px] flex-1 items-center justify-center rounded-xl bg-[#426c2b] px-5 text-[8px] font-extrabold text-white shadow-[0_8px_22px_rgba(66,108,43,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#355923] hover:shadow-[0_12px_26px_rgba(66,108,43,0.23)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50 sm:flex-none"
                  >
                    {saving
                      ? copy.saving
                      : copy.save}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}