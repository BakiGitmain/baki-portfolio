"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  createSite,
  deleteSite,
  getSites,
  updateSite,
  type MonitoredSite,
  type SiteInput,
} from "@/lib/sites-api";

import {
  useLanguage,
} from "@/components/providers/language-provider";

/* =========================================================
   ICONS
   ========================================================= */

function GlobeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M3.5 12H20.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M12 3.5C14.3 5.8 15.5 8.7 15.5 12C15.5 15.3 14.3 18.2 12 20.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M12 3.5C9.7 5.8 8.5 8.7 8.5 12C8.5 15.3 9.7 18.2 12 20.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

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

function ChartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 19V11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M10 19V5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M16 19V9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M22 19V3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 12H7L9.2 7L13 17L15.5 11H21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ServerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="6"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <rect
        x="3"
        y="14"
        width="18"
        height="6"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <circle
        cx="7"
        cy="7"
        r="1"
        fill="currentColor"
      />

      <circle
        cx="7"
        cy="17"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14 5H19V10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M12 12L19 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M19 14V18C19 18.6 18.6 19 18 19H6C5.4 19 5 18.6 5 18V6C5 5.4 5.4 5 6 5H10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 20L8.3 19L18.6 8.7C19.4 7.9 19.4 6.7 18.6 5.9L18.1 5.4C17.3 4.6 16.1 4.6 15.3 5.4L5 15.7L4 20Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M13.8 6.9L17.1 10.2"
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
        d="M5 7H19"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M9 3H15L16 7H8L9 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M7 7L8 20H16L17 7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M10 11V16M14 11V16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="10.5"
        cy="10.5"
        r="6"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M15 15L20 20"
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

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12L10 17L19 7"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 4L21 20H3L12 4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M12 9V14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="17"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}

function VercelIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 4L21 20H3L12 4Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* =========================================================
   FORM
   ========================================================= */

type SiteForm = {
  name:
    string;

  slug:
    string;

  frontendUrl:
    string;

  backendUrl:
    string;

  healthUrl:
    string;

  vercelProjectId:
    string;

  vercelTeamId:
    string;

  analyticsEnabled:
    boolean;

  monitoringEnabled:
    boolean;
};

const EMPTY_FORM:
  SiteForm = {
    name:
      "",

    slug:
      "",

    frontendUrl:
      "",

    backendUrl:
      "",

    healthUrl:
      "",

    vercelProjectId:
      "",

    vercelTeamId:
      "",

    analyticsEnabled:
      true,

    monitoringEnabled:
      true,
  };

function createSlug(
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

function siteToForm(
  site:
    MonitoredSite,
): SiteForm {
  return {
    name:
      site.name,

    slug:
      site.slug,

    frontendUrl:
      site.frontendUrl,

    backendUrl:
      site.backendUrl ??
      "",

    healthUrl:
      site.healthUrl ??
      "",

    vercelProjectId:
      site.vercelProjectId ??
      "",

    vercelTeamId:
      site.vercelTeamId ??
      "",

    analyticsEnabled:
      site.analyticsEnabled,

    monitoringEnabled:
      site.monitoringEnabled,
  };
}

/* =========================================================
   SWITCH
   ========================================================= */

function Switch({
  checked,
  onChange,
  label,
}: {
  checked:
    boolean;

  onChange:
    (
      value:
        boolean,
    ) => void;

  label:
    string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={
        checked
      }
      aria-label={
        label
      }
      onClick={() =>
        onChange(
          !checked,
        )
      }
      className={`relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors duration-300 ${
        checked
          ? "bg-[#426c2b]"
          : "bg-black/[0.10]"
      }`}
    >
      <span
        className={`absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.16)] transition-transform duration-300 ${
          checked
            ? "translate-x-[23px]"
            : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function AdminSites() {
  const {
    language,
  } = useLanguage();

  const isAm =
    language ===
    "am";

  const [
    sites,
    setSites,
  ] =
    useState<
      MonitoredSite[]
    >(
      [],
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(
      null,
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
    editingSite,
    setEditingSite,
  ] =
    useState<
      MonitoredSite | null
    >(
      null,
    );

  const [
    form,
    setForm,
  ] =
    useState<SiteForm>(
      EMPTY_FORM,
    );

  const [
    slugTouched,
    setSlugTouched,
  ] =
    useState(
      false,
    );

  const [
    saving,
    setSaving,
  ] =
    useState(
      false,
    );

  const [
    formError,
    setFormError,
  ] =
    useState<
      string | null
    >(
      null,
    );

  const [
    deletingSite,
    setDeletingSite,
  ] =
    useState<
      MonitoredSite | null
    >(
      null,
    );

  const [
    deleting,
    setDeleting,
  ] =
    useState(
      false,
    );

  /* =======================================================
     COPY
     ======================================================= */

  const copy =
    isAm
      ? {
          eyebrow:
            "SITE CONTROL CENTER",

          title:
            "የድረ-ገጽ አስተዳደር",

          description:
            "የሰራሃቸውን websites ከአንድ ቦታ ያስተዳድሩ። Analytics፣ performance እና monitoring በቀጣይ ከእያንዳንዱ site ጋር ይገናኛሉ።",

          addSite:
            "Site ጨምር",

          totalSites:
            "ጠቅላላ Sites",

          monitoring:
            "Monitoring",

          analytics:
            "Analytics",

          fullStack:
            "Full-Stack",

          searchPlaceholder:
            "Site ፈልግ...",

          noSites:
            "ገና site አልተጨመረም",

          noSitesDescription:
            "Gym House፣ Maya Burger ወይም ሌላ deployed website በመጨመር ይጀምሩ።",

          noResults:
            "የሚዛመድ site አልተገኘም።",

          frontend:
            "Frontend",

          backend:
            "Backend",

          health:
            "Health",

          vercel:
            "Vercel",

          configured:
            "Configured",

          missing:
            "Not configured",

          frontendOnly:
            "Frontend only",

          enabled:
            "Enabled",

          disabled:
            "Disabled",

          openSite:
            "Site ክፈት",

          edit:
            "Edit",

          remove:
            "Remove",

          addTitle:
            "አዲስ Site ጨምር",

          editTitle:
            "Site አስተካክል",

          editorDescription:
            "የdeployment፣ backend እና Vercel information ያስገቡ።",

          basic:
            "BASIC INFORMATION",

          connections:
            "CONNECTIONS",

          integrations:
            "INTEGRATIONS",

          siteName:
            "Site Name",

          slug:
            "Slug",

          frontendUrl:
            "Frontend URL",

          backendUrl:
            "Backend URL",

          healthUrl:
            "Health Endpoint URL",

          vercelProjectId:
            "Vercel Project ID",

          vercelTeamId:
            "Vercel Team ID",

          optional:
            "Optional",

          analyticsToggle:
            "Analytics",

          analyticsDescription:
            "Vercel analytics data እንዲያሳይ ያዘጋጁ።",

          monitoringToggle:
            "Monitoring",

          monitoringDescription:
            "Health checks እና uptime monitoring እንዲሰሩ ያዘጋጁ።",

          cancel:
            "Cancel",

          save:
            "Save Site",

          saving:
            "Saving...",

          update:
            "Update Site",

          deleteTitle:
            "Site ይወገድ?",

          deleteDescription:
            "Site manager ውስጥ ያለው data ይሰረዛል። Actual website ወይም Vercel project አይሰረዝም።",

          deleteConfirm:
            "Remove Site",

          deleting:
            "Removing...",

          loading:
            "Sites በመጫን ላይ...",

          retry:
            "Try Again",
        }
      : {
          eyebrow:
            "SITE CONTROL CENTER",

          title:
            "Website Management",

          description:
            "Manage every website you have built from one place. Analytics, performance and health monitoring will connect to each site from here.",

          addSite:
            "Add Site",

          totalSites:
            "Total Sites",

          monitoring:
            "Monitoring",

          analytics:
            "Analytics",

          fullStack:
            "Full-Stack",

          searchPlaceholder:
            "Search sites...",

          noSites:
            "No sites added yet",

          noSitesDescription:
            "Start by adding Gym House, Maya Burger or another deployed website.",

          noResults:
            "No sites match your search.",

          frontend:
            "Frontend",

          backend:
            "Backend",

          health:
            "Health",

          vercel:
            "Vercel",

          configured:
            "Configured",

          missing:
            "Not configured",

          frontendOnly:
            "Frontend only",

          enabled:
            "Enabled",

          disabled:
            "Disabled",

          openSite:
            "Open Site",

          edit:
            "Edit",

          remove:
            "Remove",

          addTitle:
            "Add New Site",

          editTitle:
            "Edit Site",

          editorDescription:
            "Add the deployment, backend and Vercel information for this website.",

          basic:
            "BASIC INFORMATION",

          connections:
            "CONNECTIONS",

          integrations:
            "INTEGRATIONS",

          siteName:
            "Site Name",

          slug:
            "Slug",

          frontendUrl:
            "Frontend URL",

          backendUrl:
            "Backend URL",

          healthUrl:
            "Health Endpoint URL",

          vercelProjectId:
            "Vercel Project ID",

          vercelTeamId:
            "Vercel Team ID",

          optional:
            "Optional",

          analyticsToggle:
            "Analytics",

          analyticsDescription:
            "Prepare this site for Vercel Analytics integration.",

          monitoringToggle:
            "Monitoring",

          monitoringDescription:
            "Prepare this site for health checks and uptime monitoring.",

          cancel:
            "Cancel",

          save:
            "Save Site",

          saving:
            "Saving...",

          update:
            "Update Site",

          deleteTitle:
            "Remove this site?",

          deleteDescription:
            "This removes the site from your manager. It does not delete the real website or Vercel project.",

          deleteConfirm:
            "Remove Site",

          deleting:
            "Removing...",

          loading:
            "Loading sites...",

          retry:
            "Try Again",
        };

  /* =======================================================
     LOAD
     ======================================================= */

  async function loadSites() {
    setError(
      null,
    );

    try {
      const result =
        await getSites(
          language,
        );

      setSites(
        result,
      );
    } catch (
      loadError
    ) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load sites.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }

  useEffect(() => {
    let cancelled =
      false;

    async function run() {
      try {
        const result =
          await getSites(
            language,
          );

        if (
          cancelled
        ) {
          return;
        }

        setSites(
          result,
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
          loadError instanceof Error
            ? loadError.message
            : "Unable to load sites.",
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

    void run();

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
      () => {
        const monitoring =
          sites.filter(
            (
              site,
            ) =>
              site.monitoringEnabled,
          ).length;

        const analytics =
          sites.filter(
            (
              site,
            ) =>
              site.analyticsEnabled,
          ).length;

        const fullStack =
          sites.filter(
            (
              site,
            ) =>
              Boolean(
                site.backendUrl,
              ),
          ).length;

        return {
          total:
            sites.length,

          monitoring,

          analytics,

          fullStack,
        };
      },
      [
        sites,
      ],
    );

  /* =======================================================
     FILTER
     ======================================================= */

  const filteredSites =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (
          !query
        ) {
          return sites;
        }

        return sites.filter(
          (
            site,
          ) => {
            return (
              site.name
                .toLowerCase()
                .includes(
                  query,
                ) ||
              site.slug
                .toLowerCase()
                .includes(
                  query,
                ) ||
              site.frontendUrl
                .toLowerCase()
                .includes(
                  query,
                )
            );
          },
        );
      },
      [
        search,
        sites,
      ],
    );

  /* =======================================================
     EDITOR
     ======================================================= */

  function openCreate() {
    setEditingSite(
      null,
    );

    setForm(
      EMPTY_FORM,
    );

    setSlugTouched(
      false,
    );

    setFormError(
      null,
    );

    setEditorOpen(
      true,
    );
  }

  function openEdit(
    site:
      MonitoredSite,
  ) {
    setEditingSite(
      site,
    );

    setForm(
      siteToForm(
        site,
      ),
    );

    setSlugTouched(
      true,
    );

    setFormError(
      null,
    );

    setEditorOpen(
      true,
    );
  }

  function closeEditor() {
    if (
      saving
    ) {
      return;
    }

    setEditorOpen(
      false,
    );

    setEditingSite(
      null,
    );

    setFormError(
      null,
    );
  }

  function updateForm<
    Key extends keyof SiteForm,
  >(
    key:
      Key,

    value:
      SiteForm[Key],
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

  function handleNameChange(
    value:
      string,
  ) {
    setForm(
      (
        current,
      ) => ({
        ...current,

        name:
          value,

        slug:
          slugTouched
            ? current.slug
            : createSlug(
                value,
              ),
      }),
    );
  }

  /* =======================================================
     SAVE
     ======================================================= */

  async function handleSave() {
    setFormError(
      null,
    );

    if (
      !form.name.trim() ||
      !form.slug.trim() ||
      !form.frontendUrl.trim()
    ) {
      setFormError(
        isAm
          ? "Site name፣ slug እና frontend URL ያስፈልጋሉ።"
          : "Site name, slug and frontend URL are required.",
      );

      return;
    }

    const input:
      SiteInput = {
        name:
          form.name.trim(),

        slug:
          form.slug
            .trim()
            .toLowerCase(),

        frontendUrl:
          form.frontendUrl.trim(),

        backendUrl:
          form.backendUrl.trim(),

        healthUrl:
          form.healthUrl.trim(),

        vercelProjectId:
          form.vercelProjectId.trim(),

        vercelTeamId:
          form.vercelTeamId.trim(),

        analyticsEnabled:
          form.analyticsEnabled,

        monitoringEnabled:
          form.monitoringEnabled,
      };

    setSaving(
      true,
    );

    try {
      if (
        editingSite
      ) {
        const updated =
          await updateSite(
            editingSite.id,
            input,
            language,
          );

        setSites(
          (
            current,
          ) =>
            current.map(
              (
                site,
              ) =>
                site.id ===
                updated.id
                  ? updated
                  : site,
            ),
        );
      } else {
        const created =
          await createSite(
            input,
            language,
          );

        setSites(
          (
            current,
          ) => [
            created,
            ...current,
          ],
        );
      }

      setEditorOpen(
        false,
      );

      setEditingSite(
        null,
      );
    } catch (
      saveError
    ) {
      setFormError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save site.",
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

  async function handleDelete() {
    if (
      !deletingSite
    ) {
      return;
    }

    setDeleting(
      true,
    );

    try {
      await deleteSite(
        deletingSite.id,
        language,
      );

      setSites(
        (
          current,
        ) =>
          current.filter(
            (
              site,
            ) =>
              site.id !==
              deletingSite.id,
          ),
      );

      setDeletingSite(
        null,
      );
    } catch (
      deleteError
    ) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to remove site.",
      );
    } finally {
      setDeleting(
        false,
      );
    }
  }

  /* =======================================================
     LOADING
     ======================================================= */

  if (
    loading
  ) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-black/[0.08] border-t-[#426c2b]" />

          <span className="text-[9px] font-semibold text-black/35">
            {
              copy.loading
            }
          </span>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <>
      {/* =================================================
          HERO
         ================================================= */}

      <section className="overflow-hidden rounded-[26px] border border-black/[0.055] bg-[radial-gradient(circle_at_90%_0%,rgba(128,201,60,0.10),transparent_34%),linear-gradient(135deg,#ffffff,#f5f8f1)] p-6 shadow-[0_12px_40px_rgba(39,53,30,0.035)] sm:p-8">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[720px]">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5e7] text-[#507d33]">
                <span className="h-[18px] w-[18px]">
                  <GlobeIcon />
                </span>
              </span>

              <span className="text-[8px] font-extrabold tracking-[0.18em] text-[#6d984d]">
                {
                  copy.eyebrow
                }
              </span>
            </div>

            <h2 className="text-[29px] font-black tracking-[-0.055em] text-[#171b15] sm:text-[36px]">
              {
                copy.title
              }
            </h2>

            <p className="mt-3 max-w-[660px] text-[10px] leading-6 text-black/42 sm:text-[10.5px]">
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
            className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#426c2b] px-5 text-[9px] font-bold text-white shadow-[0_12px_28px_rgba(66,108,43,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#315a1f]"
          >
            <span className="h-4 w-4">
              <PlusIcon />
            </span>

            {
              copy.addSite
            }
          </button>
        </div>
      </section>

      {/* =================================================
          STATS
         ================================================= */}

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label:
              copy.totalSites,

            value:
              stats.total,

            icon:
              <GlobeIcon />,
          },

          {
            label:
              copy.monitoring,

            value:
              stats.monitoring,

            icon:
              <PulseIcon />,
          },

          {
            label:
              copy.analytics,

            value:
              stats.analytics,

            icon:
              <ChartIcon />,
          },

          {
            label:
              copy.fullStack,

            value:
              stats.fullStack,

            icon:
              <ServerIcon />,
          },
        ].map(
          (
            item,
          ) => (
            <article
              key={
                item.label
              }
              className="flex items-center justify-between rounded-[19px] border border-black/[0.055] bg-white p-5 shadow-[0_7px_24px_rgba(34,47,26,0.025)]"
            >
              <div>
                <span className="text-[7.5px] font-bold uppercase tracking-[0.13em] text-black/30">
                  {
                    item.label
                  }
                </span>

                <strong className="mt-2 block text-[25px] font-black tracking-[-0.05em] text-[#1e241b]">
                  {
                    item.value
                  }
                </strong>
              </div>

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2f7ee] text-[#5d893f]">
                <span className="h-[18px] w-[18px]">
                  {
                    item.icon
                  }
                </span>
              </span>
            </article>
          ),
        )}
      </section>

      {/* =================================================
          TOOLBAR
         ================================================= */}

      <section className="mt-5 flex flex-col gap-3 rounded-[18px] border border-black/[0.055] bg-white p-3 shadow-[0_6px_20px_rgba(34,47,26,0.02)] sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-[360px]">
          <span className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/25">
            <SearchIcon />
          </span>

          <input
            value={
              search
            }
            onChange={(
              event,
            ) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder={
              copy.searchPlaceholder
            }
            className="h-10 w-full rounded-xl border border-black/[0.055] bg-[#f8f9f5] pl-10 pr-4 text-[9px] text-[#242a20] outline-none transition placeholder:text-black/25 focus:border-[#6c9850]/30 focus:bg-white focus:ring-4 focus:ring-[#6f9a50]/[0.05]"
          />
        </div>

        <div className="flex items-center gap-2 px-1">
          <span className="h-2 w-2 rounded-full bg-[#80c93c] shadow-[0_0_8px_rgba(128,201,60,0.38)]" />

          <span className="text-[8px] font-semibold text-black/34">
            {stats.total}{" "}
            {
              copy.totalSites
            }
          </span>
        </div>
      </section>

      {/* =================================================
          ERROR
         ================================================= */}

      {error && (
        <section className="mt-4 flex items-center justify-between gap-4 rounded-[16px] border border-red-200/70 bg-red-50 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="h-4 w-4 shrink-0 text-red-500">
              <WarningIcon />
            </span>

            <p className="truncate text-[9px] font-medium text-red-600">
              {
                error
              }
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setLoading(
                true,
              );

              void loadSites();
            }}
            className="shrink-0 text-[8px] font-bold text-red-600 hover:underline"
          >
            {
              copy.retry
            }
          </button>
        </section>
      )}

      {/* =================================================
          EMPTY
         ================================================= */}

      {sites.length ===
        0 &&
      !error ? (
        <section className="mt-5 flex min-h-[330px] flex-col items-center justify-center rounded-[24px] border border-dashed border-black/[0.09] bg-white px-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf5e7] text-[#507d33]">
            <span className="h-6 w-6">
              <GlobeIcon />
            </span>
          </span>

          <h3 className="mt-5 text-[15px] font-bold text-[#20251d]">
            {
              copy.noSites
            }
          </h3>

          <p className="mt-2 max-w-[390px] text-[9px] leading-5 text-black/36">
            {
              copy.noSitesDescription
            }
          </p>

          <button
            type="button"
            onClick={
              openCreate
            }
            className="mt-6 flex h-10 items-center gap-2 rounded-xl bg-[#426c2b] px-4 text-[8.5px] font-bold text-white transition hover:bg-[#315a1f]"
          >
            <span className="h-4 w-4">
              <PlusIcon />
            </span>

            {
              copy.addSite
            }
          </button>
        </section>
      ) : filteredSites.length ===
        0 ? (
        <section className="mt-5 rounded-[20px] border border-black/[0.055] bg-white p-10 text-center">
          <p className="text-[9px] text-black/35">
            {
              copy.noResults
            }
          </p>
        </section>
      ) : (
        /* =================================================
           SITE CARDS
           ================================================= */

        <section className="mt-5 grid gap-4 xl:grid-cols-2">
          {filteredSites.map(
            (
              site,
            ) => (
              <article
                key={
                  site.id
                }
                className="group overflow-hidden rounded-[22px] border border-black/[0.06] bg-white shadow-[0_8px_30px_rgba(31,44,24,0.03)] transition duration-300 hover:-translate-y-0.5 hover:border-[#679348]/15 hover:shadow-[0_16px_45px_rgba(37,52,27,0.055)]"
              >
                {/* HEADER */}

                <div className="flex items-start justify-between gap-4 border-b border-black/[0.05] p-5 sm:p-6">
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#edf5e7] text-[#507d33]">
                      <span className="h-5 w-5">
                        <GlobeIcon />
                      </span>
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-[14px] font-extrabold tracking-[-0.025em] text-[#1c2119]">
                          {
                            site.name
                          }
                        </h3>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[6.5px] font-extrabold uppercase tracking-[0.09em] ${
                            site.monitoringEnabled
                              ? "bg-[#edf6e8] text-[#507d33]"
                              : "bg-black/[0.045] text-black/35"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              site.monitoringEnabled
                                ? "bg-[#80c93c]"
                                : "bg-black/20"
                            }`}
                          />

                          {site.monitoringEnabled
                            ? copy.enabled
                            : copy.disabled}
                        </span>
                      </div>

                      <p className="mt-1.5 truncate text-[8px] text-black/32">
                        {
                          site.frontendUrl
                        }
                      </p>
                    </div>
                  </div>

                  <a
                    href={
                      site.frontendUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    aria-label={
                      copy.openSite
                    }
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/[0.055] bg-[#fafbf8] text-black/35 transition hover:border-[#719d51]/20 hover:bg-[#f3f7f0] hover:text-[#426c2b]"
                  >
                    <span className="h-4 w-4">
                      <ExternalIcon />
                    </span>
                  </a>
                </div>

                {/* INFORMATION */}

                <div className="grid grid-cols-2 gap-px bg-black/[0.045] sm:grid-cols-4">
                  <div className="bg-white p-4">
                    <span className="text-[6.5px] font-bold uppercase tracking-[0.12em] text-black/25">
                      {
                        copy.backend
                      }
                    </span>

                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          site.backendUrl
                            ? "bg-[#80c93c]"
                            : "bg-black/15"
                        }`}
                      />

                      <strong className="text-[8px] font-semibold text-black/55">
                        {site.backendUrl
                          ? copy.configured
                          : copy.frontendOnly}
                      </strong>
                    </div>
                  </div>

                  <div className="bg-white p-4">
                    <span className="text-[6.5px] font-bold uppercase tracking-[0.12em] text-black/25">
                      {
                        copy.health
                      }
                    </span>

                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          site.healthUrl
                            ? "bg-[#80c93c]"
                            : "bg-black/15"
                        }`}
                      />

                      <strong className="text-[8px] font-semibold text-black/55">
                        {site.healthUrl
                          ? copy.configured
                          : copy.missing}
                      </strong>
                    </div>
                  </div>

                  <div className="bg-white p-4">
                    <span className="text-[6.5px] font-bold uppercase tracking-[0.12em] text-black/25">
                      {
                        copy.analytics
                      }
                    </span>

                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          site.analyticsEnabled
                            ? "bg-[#80c93c]"
                            : "bg-black/15"
                        }`}
                      />

                      <strong className="text-[8px] font-semibold text-black/55">
                        {site.analyticsEnabled
                          ? copy.enabled
                          : copy.disabled}
                      </strong>
                    </div>
                  </div>

                  <div className="bg-white p-4">
                    <span className="text-[6.5px] font-bold uppercase tracking-[0.12em] text-black/25">
                      {
                        copy.vercel
                      }
                    </span>

                    <div className="mt-2 flex items-center gap-2">
                      <span className="h-3 w-3 text-black/45">
                        <VercelIcon />
                      </span>

                      <strong className="truncate text-[8px] font-semibold text-black/55">
                        {site.vercelProjectId
                          ? copy.configured
                          : copy.missing}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* FOOTER */}

                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <span className="truncate rounded-lg bg-[#f5f7f2] px-2.5 py-1.5 text-[7px] font-semibold text-black/32">
                    /
                    {
                      site.slug
                    }
                  </span>

                  <div className="flex items-center gap-2">
                    <Link
  href={`/admin/sites/${site.id}`}
  className="flex h-9 items-center gap-2 rounded-xl bg-[#426c2b] px-3.5 text-[8px] font-bold text-white transition hover:bg-[#315a1f]"
>
  <span className="h-3.5 w-3.5">
    <ChartIcon />
  </span>

  {isAm
    ? "Manage"
    : "Manage"}
</Link>
                    <button
                      type="button"
                      onClick={() =>
                        openEdit(
                          site,
                        )
                      }
                      className="flex h-9 items-center gap-2 rounded-xl border border-black/[0.06] bg-white px-3.5 text-[8px] font-semibold text-black/45 transition hover:border-[#709c50]/20 hover:bg-[#f4f8f1] hover:text-[#426c2b]"
                    >
                      <span className="h-3.5 w-3.5">
                        <PencilIcon />
                      </span>

                      {
                        copy.edit
                      }
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setDeletingSite(
                          site,
                        )
                      }
                      className="flex h-9 items-center gap-2 rounded-xl border border-red-100 bg-white px-3.5 text-[8px] font-semibold text-red-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <span className="h-3.5 w-3.5">
                        <TrashIcon />
                      </span>

                      {
                        copy.remove
                      }
                    </button>
                  </div>
                </div>
              </article>
            ),
          )}
        </section>
      )}

      {/* =================================================
          EDITOR MODAL
         ================================================= */}

      {editorOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/25 p-0 backdrop-blur-[4px] sm:items-center sm:p-5">
          <button
            type="button"
            aria-label={
              copy.cancel
            }
            className="absolute inset-0"
            onClick={
              closeEditor
            }
          />

          <section className="relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-[26px] border border-black/[0.07] bg-[#fafbf8] shadow-[0_30px_100px_rgba(20,29,16,0.22)] sm:max-w-[760px] sm:rounded-[26px]">
            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-black/[0.055] bg-[#fafbf8]/95 p-5 backdrop-blur-xl sm:p-6">
              <div>
                <span className="text-[7px] font-extrabold uppercase tracking-[0.15em] text-[#709a52]">
                  {editingSite
                    ? "EDIT SITE"
                    : "NEW SITE"}
                </span>

                <h3 className="mt-2 text-[21px] font-black tracking-[-0.045em] text-[#1b2018]">
                  {editingSite
                    ? copy.editTitle
                    : copy.addTitle}
                </h3>

                <p className="mt-1.5 text-[8.5px] leading-5 text-black/35">
                  {
                    copy.editorDescription
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeEditor
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/[0.055] bg-white text-black/35 transition hover:text-black/65"
              >
                <span className="h-4 w-4">
                  <CloseIcon />
                </span>
              </button>
            </div>

            {/* MODAL BODY */}

            <div className="space-y-6 p-5 sm:p-6">
              {formError && (
                <div className="flex items-start gap-3 rounded-[14px] border border-red-100 bg-red-50 p-3.5">
                  <span className="mt-0.5 h-4 w-4 shrink-0 text-red-500">
                    <WarningIcon />
                  </span>

                  <p className="text-[8.5px] leading-5 text-red-600">
                    {
                      formError
                    }
                  </p>
                </div>
              )}

              {/* BASIC */}

              <div>
                <span className="mb-3 block text-[7px] font-extrabold tracking-[0.14em] text-black/28">
                  {
                    copy.basic
                  }
                </span>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-[8px] font-semibold text-black/48">
                      {
                        copy.siteName
                      }
                    </span>

                    <input
                      value={
                        form.name
                      }
                      onChange={(
                        event,
                      ) =>
                        handleNameChange(
                          event.target.value,
                        )
                      }
                      placeholder="Gym House"
                      className="admin-site-input"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[8px] font-semibold text-black/48">
                      {
                        copy.slug
                      }
                    </span>

                    <input
                      value={
                        form.slug
                      }
                      onChange={(
                        event,
                      ) => {
                        setSlugTouched(
                          true,
                        );

                        updateForm(
                          "slug",
                          createSlug(
                            event.target.value,
                          ),
                        );
                      }}
                      placeholder="gym-house"
                      className="admin-site-input"
                    />
                  </label>
                </div>
              </div>

              {/* CONNECTIONS */}

              <div>
                <span className="mb-3 block text-[7px] font-extrabold tracking-[0.14em] text-black/28">
                  {
                    copy.connections
                  }
                </span>

                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-[8px] font-semibold text-black/48">
                      {
                        copy.frontendUrl
                      }
                    </span>

                    <input
                      type="url"
                      value={
                        form.frontendUrl
                      }
                      onChange={(
                        event,
                      ) =>
                        updateForm(
                          "frontendUrl",
                          event.target.value,
                        )
                      }
                      placeholder="https://gym-house.vercel.app"
                      className="admin-site-input"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 flex items-center justify-between gap-3 text-[8px] font-semibold text-black/48">
                        <span>
                          {
                            copy.backendUrl
                          }
                        </span>

                        <span className="text-[6.5px] font-medium text-black/23">
                          {
                            copy.optional
                          }
                        </span>
                      </span>

                      <input
                        type="url"
                        value={
                          form.backendUrl
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            "backendUrl",
                            event.target.value,
                          )
                        }
                        placeholder="https://api.example.com"
                        className="admin-site-input"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 flex items-center justify-between gap-3 text-[8px] font-semibold text-black/48">
                        <span>
                          {
                            copy.healthUrl
                          }
                        </span>

                        <span className="text-[6.5px] font-medium text-black/23">
                          {
                            copy.optional
                          }
                        </span>
                      </span>

                      <input
                        type="url"
                        value={
                          form.healthUrl
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            "healthUrl",
                            event.target.value,
                          )
                        }
                        placeholder="https://api.example.com/api/health"
                        className="admin-site-input"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* VERCEL */}

              <div>
                <span className="mb-3 block text-[7px] font-extrabold tracking-[0.14em] text-black/28">
                  {
                    copy.integrations
                  }
                </span>

                <div className="rounded-[18px] border border-black/[0.055] bg-white p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
                      <span className="h-4 w-4">
                        <VercelIcon />
                      </span>
                    </span>

                    <div>
                      <strong className="block text-[9px] font-bold text-[#22271f]">
                        Vercel
                      </strong>

                      <span className="mt-0.5 block text-[7px] text-black/28">
                        Analytics integration
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 flex items-center justify-between text-[8px] font-semibold text-black/48">
                        <span>
                          {
                            copy.vercelProjectId
                          }
                        </span>

                        <span className="text-[6.5px] font-medium text-black/23">
                          {
                            copy.optional
                          }
                        </span>
                      </span>

                      <input
                        value={
                          form.vercelProjectId
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            "vercelProjectId",
                            event.target.value,
                          )
                        }
                        placeholder="prj_xxxxxxxxx"
                        className="admin-site-input font-mono"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 flex items-center justify-between text-[8px] font-semibold text-black/48">
                        <span>
                          {
                            copy.vercelTeamId
                          }
                        </span>

                        <span className="text-[6.5px] font-medium text-black/23">
                          {
                            copy.optional
                          }
                        </span>
                      </span>

                      <input
                        value={
                          form.vercelTeamId
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            "vercelTeamId",
                            event.target.value,
                          )
                        }
                        placeholder="team_xxxxxxxxx"
                        className="admin-site-input font-mono"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* TOGGLES */}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between gap-5 rounded-[17px] border border-black/[0.055] bg-white p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-4 text-[#5d8a40]">
                        <ChartIcon />
                      </span>

                      <strong className="text-[9px] font-bold text-[#22271f]">
                        {
                          copy.analyticsToggle
                        }
                      </strong>
                    </div>

                    <p className="mt-1.5 text-[7.5px] leading-4 text-black/30">
                      {
                        copy.analyticsDescription
                      }
                    </p>
                  </div>

                  <Switch
                    checked={
                      form.analyticsEnabled
                    }
                    onChange={(
                      value,
                    ) =>
                      updateForm(
                        "analyticsEnabled",
                        value,
                      )
                    }
                    label={
                      copy.analyticsToggle
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-5 rounded-[17px] border border-black/[0.055] bg-white p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-4 text-[#5d8a40]">
                        <PulseIcon />
                      </span>

                      <strong className="text-[9px] font-bold text-[#22271f]">
                        {
                          copy.monitoringToggle
                        }
                      </strong>
                    </div>

                    <p className="mt-1.5 text-[7.5px] leading-4 text-black/30">
                      {
                        copy.monitoringDescription
                      }
                    </p>
                  </div>

                  <Switch
                    checked={
                      form.monitoringEnabled
                    }
                    onChange={(
                      value,
                    ) =>
                      updateForm(
                        "monitoringEnabled",
                        value,
                      )
                    }
                    label={
                      copy.monitoringToggle
                    }
                  />
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}

            <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-black/[0.055] bg-[#fafbf8]/95 p-4 backdrop-blur-xl sm:px-6">
              <button
                type="button"
                disabled={
                  saving
                }
                onClick={
                  closeEditor
                }
                className="h-10 rounded-xl border border-black/[0.065] bg-white px-4 text-[8.5px] font-semibold text-black/45 transition hover:text-black/70 disabled:opacity-40"
              >
                {
                  copy.cancel
                }
              </button>

              <button
                type="button"
                disabled={
                  saving
                }
                onClick={() =>
                  void handleSave()
                }
                className="flex h-10 min-w-[110px] items-center justify-center gap-2 rounded-xl bg-[#426c2b] px-4 text-[8.5px] font-bold text-white shadow-[0_9px_20px_rgba(66,108,43,0.16)] transition hover:bg-[#315a1f] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {saving ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white/30 border-t-white" />

                    {
                      copy.saving
                    }
                  </>
                ) : (
                  <>
                    <span className="h-3.5 w-3.5">
                      <CheckIcon />
                    </span>

                    {editingSite
                      ? copy.update
                      : copy.save}
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* =================================================
          DELETE MODAL
         ================================================= */}

      {deletingSite && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/25 p-5 backdrop-blur-[4px]">
          <button
            type="button"
            className="absolute inset-0"
            aria-label={
              copy.cancel
            }
            onClick={() => {
              if (
                !deleting
              ) {
                setDeletingSite(
                  null,
                );
              }
            }}
          />

          <section className="relative z-10 w-full max-w-[430px] rounded-[24px] border border-black/[0.07] bg-white p-6 shadow-[0_30px_100px_rgba(27,35,22,0.20)]">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <span className="h-5 w-5">
                <TrashIcon />
              </span>
            </span>

            <h3 className="mt-5 text-[18px] font-black tracking-[-0.04em] text-[#20251d]">
              {
                copy.deleteTitle
              }
            </h3>

            <p className="mt-2 text-[8.5px] leading-5 text-black/38">
              {
                copy.deleteDescription
              }
            </p>

            <div className="mt-4 rounded-xl bg-[#f7f8f4] px-3 py-2.5">
              <strong className="text-[9px] font-bold text-[#252b21]">
                {
                  deletingSite.name
                }
              </strong>

              <span className="mt-0.5 block truncate text-[7px] text-black/28">
                {
                  deletingSite.frontendUrl
                }
              </span>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={
                  deleting
                }
                onClick={() =>
                  setDeletingSite(
                    null,
                  )
                }
                className="h-10 rounded-xl border border-black/[0.065] px-4 text-[8.5px] font-semibold text-black/45 disabled:opacity-40"
              >
                {
                  copy.cancel
                }
              </button>

              <button
                type="button"
                disabled={
                  deleting
                }
                onClick={() =>
                  void handleDelete()
                }
                className="flex h-10 min-w-[110px] items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-[8.5px] font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white/30 border-t-white" />

                    {
                      copy.deleting
                    }
                  </>
                ) : (
                  <>
                    <span className="h-3.5 w-3.5">
                      <TrashIcon />
                    </span>

                    {
                      copy.deleteConfirm
                    }
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}