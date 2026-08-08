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
  id:
    string;

  publicId:
    string;

  url:
    string;

  previewUrl:
    string;

  altEn:
    string;

  altAm:
    string;

  file:
    File | null;
};

type ProjectForm = {
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
    string;

  liveUrl:
    string;

  coverImagePublicId:
    string;

  coverImageUrl:
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
    GalleryEditorItem[];
};

/* =========================================================
   DEFAULT
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
          ? "block lg:col-span-2"
          : "block"
      }
    >
      <span className="mb-2 block text-[8px] font-bold uppercase tracking-[0.12em] text-black/35">
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
  ] = useState(true);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    editorOpen,
    setEditorOpen,
  ] = useState(false);

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
    useState<string | null>(
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
    useState<File | null>(
      null,
    );

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  /* =======================================================
     COPY
     ======================================================= */

  const copy =
    language === "am"
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
        };

  /* =======================================================
     LOAD
     ======================================================= */

  useEffect(() => {
    let cancelled =
      false;

    async function loadProjects() {
      try {
        const result =
          await getAdminProjects(
            language,
          );

        if (
          !cancelled
        ) {
          setProjects(
            sortProjects(
              result,
            ),
          );
        }
      } catch (
        loadError
      ) {
        if (
          !cancelled
        ) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load projects.",
          );
        }
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
  }, [
    language,
  ]);

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

  const filteredProjects =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (!query) {
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
     FORM
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

    setEditorOpen(
      true,
    );
  }

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

    setEditorOpen(
      true,
    );
  }

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
     COVER
     ======================================================= */

  function selectFile(
    file:
      File | null,
  ) {
    if (!file) {
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
  }

  /* =======================================================
     GALLERY
     ======================================================= */

  function addGalleryFiles(
    files:
      FileList | null,
  ) {
    if (!files) {
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

    const selected =
      Array.from(
        files,
      )
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
      Array.from(
        files,
      ).length >
      availableSlots
    ) {
      setError(
        "Only the first available images were added. Maximum gallery size is 5.",
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
      -1 | 1,
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
      "en" | "am",

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

          return languageKey ===
            "en"
            ? {
                ...item,

                altEn:
                  value,
              }
            : {
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

      /* COVER */

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

      /* GALLERY */

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

        if (!publicId) {
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
      <section>
        {/* HEADER */}

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
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#426c2b] px-5 text-[9px] font-bold text-white shadow-[0_12px_30px_rgba(66,108,43,0.18)]"
          >
            <span className="h-4 w-4">
              <PlusIcon />
            </span>

            {
              copy.add
            }
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[9px] text-red-600">
            {
              error
            }
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-xl border border-[#7bad56]/20 bg-[#edf5e7] px-4 py-3 text-[9px] text-[#426c2b]">
            {
              success
            }
          </div>
        )}

        {/* STATS */}

        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            [
              copy.total,
              stats.total,
            ],

            [
              copy.published,
              stats.published,
            ],

            [
              copy.drafts,
              stats.drafts,
            ],

            [
              copy.featured,
              stats.featured,
            ],
          ].map(
            ([
              label,
              value,
            ]) => (
              <div
                key={
                  label
                }
                className="rounded-2xl border border-black/[0.055] bg-white p-5"
              >
                <span className="text-[7px] text-black/30">
                  {
                    label
                  }
                </span>

                <strong className="mt-3 block text-[22px] font-black">
                  {
                    value
                  }
                </strong>
              </div>
            ),
          )}
        </div>

        {/* LIST */}

        <div className="mt-5 overflow-hidden rounded-2xl border border-black/[0.055] bg-white">
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

          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-t-[#426c2b]" />
            </div>
          ) : (
            filteredProjects.map(
              (
                project,
              ) => (
                <div
                  key={
                    project.id
                  }
                  className="flex flex-col gap-4 border-b border-black/[0.05] p-4 last:border-0 sm:flex-row sm:items-center"
                >
                  <img
                    src={
                      project.coverImageUrl
                    }
                    alt={
                      project.titleEn
                    }
                    className="h-[72px] w-[120px] rounded-xl object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-[11px]">
                        {
                          project.titleEn
                        }
                      </strong>

                      <span className="rounded-full bg-[#edf5e7] px-2.5 py-1 text-[6px] uppercase text-[#426c2b]">
                        {
                          project.status
                        }
                      </span>

                      {project.featured && (
                        <span className="rounded-full bg-[#eff7d7] px-2.5 py-1 text-[6px] uppercase text-[#688d32]">
                          FEATURED
                        </span>
                      )}

                      {project.gallery.length >
                        0 && (
                        <span className="rounded-full bg-[#f2f4ef] px-2.5 py-1 text-[6px] text-black/40">
                          {project.gallery.length} gallery
                        </span>
                      )}
                    </div>

                    <span className="mt-1 block text-[8px] text-black/30">
                      /
                      {
                        project.slug
                      }
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openEdit(
                          project,
                        )
                      }
                      className="flex h-9 items-center gap-2 rounded-xl border border-black/[0.07] px-3 text-[8px]"
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
                      onClick={() =>
                        void handleDelete(
                          project,
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 text-red-500"
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

      {/* =================================================
          EDITOR
         ================================================= */}

      {editorOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/20 backdrop-blur-[2px]">
          <button
            type="button"
            aria-label="Close editor"
            onClick={
              closeEditor
            }
            className="absolute inset-0"
          />

          <div className="relative z-10 flex h-full w-full max-w-[900px] flex-col bg-[#fbfcf8] shadow-[-20px_0_60px_rgba(20,30,15,0.12)]">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-5 sm:px-7">
              <div>
                <span className="text-[7px] font-bold tracking-[0.16em] text-[#6c974f]">
                  PROJECT EDITOR
                </span>

                <h3 className="mt-1 text-[20px] font-black">
                  {editorMode ===
                  "create"
                    ? copy.createTitle
                    : copy.editTitle}
                </h3>
              </div>

              <button
                type="button"
                onClick={
                  closeEditor
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.06] bg-white"
              >
                <span className="h-4 w-4">
                  <CloseIcon />
                </span>
              </button>
            </div>

            {/* TABS */}

            <div className="flex gap-2 border-b border-black/[0.06] px-5 py-3 sm:px-7">
              {[
                [
                  "basic",
                  copy.basic,
                ],

                [
                  "case-study",
                  copy.caseStudy,
                ],

                [
                  "gallery",
                  `${copy.gallery} (${form.gallery.length}/5)`,
                ],
              ].map(
                ([
                  tab,
                  label,
                ]) => (
                  <button
                    key={
                      tab
                    }
                    type="button"
                    onClick={() =>
                      setEditorTab(
                        tab as EditorTab,
                      )
                    }
                    className={`rounded-xl px-4 py-2 text-[8px] font-bold transition ${
                      editorTab ===
                      tab
                        ? "bg-[#edf5e7] text-[#426c2b]"
                        : "text-black/35"
                    }`}
                  >
                    {
                      label
                    }
                  </button>
                ),
              )}
            </div>

            {/* BODY */}

            <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
              {/* BASIC */}

              {editorTab ===
                "basic" && (
                <div className="space-y-6">
                  <label className="block overflow-hidden rounded-2xl border border-dashed border-black/[0.12] bg-white">
                    {previewUrl ? (
                      <img
                        src={
                          previewUrl
                        }
                        alt="Cover preview"
                        className="aspect-[16/7] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[16/7] items-center justify-center text-[9px] text-black/30">
                        Choose cover image
                      </div>
                    )}

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

                    <span className="block px-4 py-3 text-center text-[8px] font-bold text-[#426c2b]">
                      Select Cover Image
                    </span>
                  </label>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <Field label="Title EN">
                      <input
                        value={
                          form.titleEn
                        }
                        onChange={(
                          event,
                        ) => {
                          const value =
                            event.target
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
                        className="admin-project-input"
                      />
                    </Field>

                    <Field label="Live URL">
                      <input
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
                        className="admin-project-input resize-none"
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
                        className="admin-project-input resize-none"
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
                        className="admin-project-input resize-none"
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
                        className="admin-project-input resize-none"
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
                              .value as ProjectStatus,
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
                  </div>

                  <label className="flex items-center justify-between rounded-xl border border-black/[0.06] bg-white p-4">
                    <span className="text-[9px] font-bold">
                      Featured Project
                    </span>

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
                      className="h-4 w-4 accent-[#426c2b]"
                    />
                  </label>
                </div>
              )}

              {/* CASE STUDY */}

              {editorTab ===
                "case-study" && (
                <div className="space-y-8">
                  <div className="grid gap-4 lg:grid-cols-2">
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

                    {[
                      [
                        "Overview EN",
                        "overviewEn",
                      ],

                      [
                        "Overview AM",
                        "overviewAm",
                      ],

                      [
                        "Challenge EN",
                        "challengeEn",
                      ],

                      [
                        "Challenge AM",
                        "challengeAm",
                      ],

                      [
                        "Solution EN",
                        "solutionEn",
                      ],

                      [
                        "Solution AM",
                        "solutionAm",
                      ],
                    ].map(
                      ([
                        label,
                        field,
                      ]) => (
                        <Field
                          key={
                            field
                          }
                          label={
                            label
                          }
                          full
                        >
                          <textarea
                            value={
                              form[
                                field as
                                  | "overviewEn"
                                  | "overviewAm"
                                  | "challengeEn"
                                  | "challengeAm"
                                  | "solutionEn"
                                  | "solutionAm"
                              ]
                            }
                            onChange={(
                              event,
                            ) =>
                              updateForm(
                                field as
                                  | "overviewEn"
                                  | "overviewAm"
                                  | "challengeEn"
                                  | "challengeAm"
                                  | "solutionEn"
                                  | "solutionAm",

                                event
                                  .target
                                  .value,
                              )
                            }
                            rows={
                              5
                            }
                            className="admin-project-input resize-none"
                          />
                        </Field>
                      ),
                    )}
                  </div>

                  {/* HOW IT WORKS */}

                  <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
                    <div className="flex items-center justify-between">
                      <strong className="text-[13px]">
                        How It Works
                      </strong>

                      <button
                        type="button"
                        onClick={
                          addStep
                        }
                        className="rounded-xl bg-[#edf5e7] px-4 py-2 text-[8px] font-bold text-[#426c2b]"
                      >
                        + Add Step
                      </button>
                    </div>

                    <div className="mt-5 space-y-4">
                      {form.howItWorks.map(
                        (
                          step,
                          index,
                        ) => (
                          <div
                            key={
                              index
                            }
                            className="rounded-xl border border-black/[0.06] bg-[#fafbf8] p-4"
                          >
                            <div className="mb-3 flex justify-between">
                              <strong className="text-[8px] text-[#426c2b]">
                                STEP{" "}
                                {
                                  index +
                                  1
                                }
                              </strong>

                              <button
                                type="button"
                                onClick={() =>
                                  removeStep(
                                    index,
                                  )
                                }
                                className="text-[8px] text-red-500"
                              >
                                Remove
                              </button>
                            </div>

                            <div className="grid gap-3 lg:grid-cols-2">
                              <input
                                value={
                                  step.title.en
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
                                  step.title.am
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
                                  step.description.en
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
                                className="admin-project-input resize-none"
                              />

                              <textarea
                                value={
                                  step.description.am
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
                                className="admin-project-input resize-none"
                              />
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  {/* FEATURES */}

                  <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
                    <div className="flex items-center justify-between">
                      <strong className="text-[13px]">
                        Key Features
                      </strong>

                      <button
                        type="button"
                        onClick={
                          addFeature
                        }
                        className="rounded-xl bg-[#edf5e7] px-4 py-2 text-[8px] font-bold text-[#426c2b]"
                      >
                        + Add Feature
                      </button>
                    </div>

                    <div className="mt-5 space-y-3">
                      {form.features.map(
                        (
                          feature,
                          index,
                        ) => (
                          <div
                            key={
                              index
                            }
                            className="rounded-xl border border-black/[0.06] bg-[#fafbf8] p-4"
                          >
                            <div className="mb-3 flex justify-end">
                              <button
                                type="button"
                                onClick={() =>
                                  removeFeature(
                                    index,
                                  )
                                }
                                className="text-[8px] text-red-500"
                              >
                                Remove
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
                  </div>
                </div>
              )}

              {/* =================================================
                  GALLERY
                 ================================================= */}

              {editorTab ===
                "gallery" && (
                <div>
                  <div className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <span className="text-[7px] font-extrabold tracking-[0.16em] text-[#6c974f]">
                          PROJECT GALLERY
                        </span>

                        <h4 className="mt-2 text-[18px] font-black tracking-[-0.04em]">
                          Website Screens
                        </h4>

                        <p className="mt-2 max-w-[480px] text-[8.5px] leading-5 text-black/35">
                          Add up to 5 screenshots. Their order here is the same order used by the public slider.
                        </p>
                      </div>

                      <div className="flex h-10 items-center rounded-xl bg-[#f3f7ef] px-4 text-[9px] font-bold text-[#426c2b]">
                        {form.gallery.length}
                        /5
                      </div>
                    </div>

                    {/* ADD */}

                    {form.gallery.length <
                      5 && (
                      <label className="mt-6 flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-[#5f8f3f]/25 bg-[#f8fbf6] px-5 py-8 transition hover:border-[#5f8f3f]/45 hover:bg-[#f3f8ef]">
                        <div className="text-center">
                          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf3e4] text-[#426c2b]">
                            <span className="h-5 w-5">
                              <PlusIcon />
                            </span>
                          </span>

                          <strong className="mt-3 block text-[9px] text-[#22271f]">
                            Add Gallery Images
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
                  </div>

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
                          className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_8px_30px_rgba(28,40,21,0.035)]"
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

                            {/* REORDER */}

                            <div className="absolute bottom-3 right-3 flex gap-1.5">
                              <button
                                type="button"
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
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-[#426c2b] shadow-sm backdrop-blur disabled:opacity-30"
                              >
                                <span className="h-4 w-4">
                                  <LeftIcon />
                                </span>
                              </button>

                              <button
                                type="button"
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
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-[#426c2b] shadow-sm backdrop-blur disabled:opacity-30"
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

                              Remove Image
                            </button>
                          </div>
                        </article>
                      ),
                    )}
                  </div>

                  {form.gallery.length ===
                    0 && (
                    <div className="mt-5 flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-black/[0.08] text-center">
                      <div>
                        <span className="text-[9px] font-bold text-black/35">
                          No gallery images yet
                        </span>

                        <p className="mt-1 text-[7.5px] text-black/25">
                          The project cover image will be used until you add gallery screenshots.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* FOOTER */}

            <div className="flex items-center justify-end gap-2 border-t border-black/[0.06] bg-white px-5 py-4 sm:px-7">
              <button
                type="button"
                onClick={
                  closeEditor
                }
                disabled={
                  saving
                }
                className="h-10 rounded-xl border border-black/[0.07] px-4 text-[8px] font-bold text-black/40"
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
                className="h-10 rounded-xl bg-[#426c2b] px-5 text-[8px] font-bold text-white disabled:opacity-50"
              >
                {saving
                  ? copy.saving
                  : copy.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}