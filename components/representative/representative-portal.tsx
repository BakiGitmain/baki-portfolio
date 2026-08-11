"use client";

import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  completeRepresentativeTraining,
  createRepresentativeReport,
  getCurrentRepresentative,
  getRepresentativeDashboard,
  getRepresentativeReports,
  getRepresentativeResources,
  getRepresentativeTraining,
  logoutRepresentative,
  type RepresentativeDashboardData,
  type RepresentativeReport,
  type RepresentativeReportCategory,
  type RepresentativeResource,
  type RepresentativeTrainingModule,
  type RepresentativeUser,
} from "@/lib/representative-api";

/* =========================================================
   TYPES
   ========================================================= */

type PortalTab =
  | "dashboard"
  | "reports"
  | "training"
  | "resources"
  | "account";

type ThemeMode =
  | "light"
  | "dark";

type PortalStyle =
  CSSProperties &
    Record<
      `--portal-${string}`,
      string
    >;

/* =========================================================
   THEME
   ========================================================= */

const THEME_STORAGE_KEY =
  "baki-sales-portal-theme";

const THEME_EVENT =
  "baki-sales-portal-theme-change";

function getThemeSnapshot():
  ThemeMode {
  if (
    typeof window ===
    "undefined"
  ) {
    return "light";
  }

  try {
    const saved =
      window.localStorage.getItem(
        THEME_STORAGE_KEY,
      );

    if (
      saved ===
        "light" ||
      saved ===
        "dark"
    ) {
      return saved;
    }
  } catch {
    //
  }

  return "light";
}

function getServerThemeSnapshot():
  ThemeMode {
  return "light";
}

function subscribeTheme(
  callback:
    () => void,
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return () => {};
  }

  const media =
    window.matchMedia(
      "(prefers-color-scheme: dark)",
    );

  const handleChange =
    () => {
      callback();
    };

  window.addEventListener(
    "storage",
    handleChange,
  );

  window.addEventListener(
    THEME_EVENT,
    handleChange,
  );

  media.addEventListener(
    "change",
    handleChange,
  );

  return () => {
    window.removeEventListener(
      "storage",
      handleChange,
    );

    window.removeEventListener(
      THEME_EVENT,
      handleChange,
    );

    media.removeEventListener(
      "change",
      handleChange,
    );
  };
}

function usePortalTheme() {
  return useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
}

function saveTheme(
  theme:
    ThemeMode,
) {
  try {
    window.localStorage.setItem(
      THEME_STORAGE_KEY,
      theme,
    );
  } catch {
    //
  }

  window.dispatchEvent(
    new Event(
      THEME_EVENT,
    ),
  );
}

/* =========================================================
   ICON BASE
   ========================================================= */

function Icon({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-full w-full"
    >
      {
        children
      }
    </svg>
  );
}

/* =========================================================
   ICONS
   ========================================================= */

function DashboardIcon() {
  return (
    <Icon>
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </Icon>
  );
}

function ReportIcon() {
  return (
    <Icon>
      <path
        d="M6 3H15L19 7V21H6V3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M15 3V7H19"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M9 12H16M9 16H14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </Icon>
  );
}

function TrainingIcon() {
  return (
    <Icon>
      <rect
        x="3"
        y="4"
        width="18"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M10 8L16 11L10 14V8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M8 21H16M12 18V21"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </Icon>
  );
}

function ResourceIcon() {
  return (
    <Icon>
      <path
        d="M5 4H19V20H5V4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M8 8H16M8 12H16M8 16H13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </Icon>
  );
}

function UserIcon() {
  return (
    <Icon>
      <circle
        cx="12"
        cy="8"
        r="4"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M5 20C5.8 16.7 8.3 15 12 15C15.7 15 18.2 16.7 19 20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </Icon>
  );
}

function LogoutIcon() {
  return (
    <Icon>
      <path
        d="M10 5H5V19H10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M14 8L18 12L14 16M8 12H18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  );
}

function PlusIcon() {
  return (
    <Icon>
      <path
        d="M12 5V19M5 12H19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Icon>
  );
}

function CheckIcon() {
  return (
    <Icon>
      <path
        d="M5 12L10 17L19 7"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  );
}

function MenuIcon() {
  return (
    <Icon>
      <path
        d="M4 7H20M4 12H20M4 17H20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Icon>
  );
}

function CloseIcon() {
  return (
    <Icon>
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Icon>
  );
}

function SunIcon() {
  return (
    <Icon>
      <circle
        cx="12"
        cy="12"
        r="4"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M12 2V4M12 20V22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M2 12H4M20 12H22M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </Icon>
  );
}

function MoonIcon() {
  return (
    <Icon>
      <path
        d="M20 15.4A8 8 0 0 1 8.6 4A8.2 8.2 0 1 0 20 15.4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  );
}

function TargetIcon() {
  return (
    <Icon>
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <circle
        cx="12"
        cy="12"
        r="4"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <circle
        cx="12"
        cy="12"
        r="1"
        fill="currentColor"
      />
    </Icon>
  );
}

function TrophyIcon() {
  return (
    <Icon>
      <path
        d="M8 4H16V8C16 11.2 14.4 13 12 13C9.6 13 8 11.2 8 8V4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M8 6H4V7C4 9.2 5.2 10.5 7.4 11M16 6H20V7C20 9.2 18.8 10.5 16.6 11"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M12 13V17M8 20H16M10 17H14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </Icon>
  );
}

function SparkIcon() {
  return (
    <Icon>
      <path
        d="M12 3L13.7 8.3L19 10L13.7 11.7L12 17L10.3 11.7L5 10L10.3 8.3L12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      <path
        d="M18 16L18.8 18.2L21 19L18.8 19.8L18 22L17.2 19.8L15 19L17.2 18.2L18 16Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </Icon>
  );
}

function ArrowUpRightIcon() {
  return (
    <Icon>
      <path
        d="M7 17L17 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M9 7H17V15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  );
}

function ArrowRightIcon() {
  return (
    <Icon>
      <path
        d="M5 12H19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M14 7L19 12L14 17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  );
}

function LockIcon() {
  return (
    <Icon>
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 10V7.5C8 5.6 9.6 4 12 4C14.4 4 16 5.6 16 7.5V10"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </Icon>
  );
}

function ShieldIcon() {
  return (
    <Icon>
      <path
        d="M12 3L19 6V11C19 15.5 16.2 19.2 12 21C7.8 19.2 5 15.5 5 11V6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M9 12L11 14L15 10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  );
}

/* =========================================================
   HELPERS
   ========================================================= */

function formatDate(
  value:
    string,
) {
  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month:
        "short",

      day:
        "numeric",

      year:
        "numeric",
    },
  ).format(
    date,
  );
}

function reportStatusClass(
  status:
    string,

  dark:
    boolean,
) {
  if (
    dark
  ) {
    switch (
      status
    ) {
      case "won":
        return "bg-emerald-400/10 text-emerald-300";

      case "lost":
        return "bg-red-400/10 text-red-300";

      case "qualified":
        return "bg-blue-400/10 text-blue-300";

      case "reviewing":
        return "bg-violet-400/10 text-violet-300";

      default:
        return "bg-amber-400/10 text-amber-300";
    }
  }

  switch (
    status
  ) {
    case "won":
      return "bg-[#eaf5e4] text-[#426c2b]";

    case "lost":
      return "bg-red-50 text-red-500";

    case "qualified":
      return "bg-[#edf4ff] text-[#426da9]";

    case "reviewing":
      return "bg-[#f1edff] text-[#7153a8]";

    default:
      return "bg-[#fff8e8] text-[#916b1c]";
  }
}

function getYouTubeEmbedUrl(
  value:
    string | null,
) {
  if (
    !value
  ) {
    return null;
  }

  try {
    const url =
      new URL(
        value,
      );

    if (
      url.hostname ===
      "youtu.be"
    ) {
      const id =
        url.pathname.replace(
          "/",
          "",
        );

      return id
        ? `https://www.youtube.com/embed/${id}`
        : null;
    }

    if (
      url.hostname.includes(
        "youtube.com",
      )
    ) {
      const id =
        url.searchParams.get(
          "v",
        );

      return id
        ? `https://www.youtube.com/embed/${id}`
        : null;
    }
  } catch {
    //
  }

  return null;
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function RepresentativePortal() {
  const router =
    useRouter();

  const theme =
    usePortalTheme();

  const dark =
    theme ===
    "dark";

  const [
    user,
    setUser,
  ] =
    useState<
      RepresentativeUser |
      null
    >(
      null,
    );

  const [
    dashboard,
    setDashboard,
  ] =
    useState<
      RepresentativeDashboardData |
      null
    >(
      null,
    );

  const [
    reports,
    setReports,
  ] =
    useState<
      RepresentativeReport[]
    >(
      [],
    );

  const [
    training,
    setTraining,
  ] =
    useState<
      RepresentativeTrainingModule[]
    >(
      [],
    );

  const [
    resources,
    setResources,
  ] =
    useState<
      RepresentativeResource[]
    >(
      [],
    );

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<PortalTab>(
      "dashboard",
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
    useState(
      "",
    );

  const [
    menuOpen,
    setMenuOpen,
  ] =
    useState(
      false,
    );

  const [
    reportOpen,
    setReportOpen,
  ] =
    useState(
      false,
    );

  const [
    reportSaving,
    setReportSaving,
  ] =
    useState(
      false,
    );

  const [
    completingTraining,
    setCompletingTraining,
  ] =
    useState<
      string |
      null
    >(
      null,
    );

  const [
    reportForm,
    setReportForm,
  ] =
    useState({
      category:
        "lead" as
          RepresentativeReportCategory,

      title:
        "",

      businessName:
        "",

      contactName:
        "",

      clientPhone:
        "",

      clientEmail:
        "",

      estimatedBudget:
        "",

      details:
        "",
    });

  /* =======================================================
     THEME TOKENS
     ======================================================= */

  const portalStyle:
    PortalStyle = {
      "--portal-bg":
        dark
          ? "#0c100c"
          : "#f4f7f1",

      "--portal-sidebar":
        dark
          ? "#101510"
          : "#fbfcf9",

      "--portal-surface":
        dark
          ? "#151b14"
          : "#ffffff",

      "--portal-surface-2":
        dark
          ? "#1a2119"
          : "#f8faf6",

      "--portal-surface-3":
        dark
          ? "#20291e"
          : "#f0f5eb",

      "--portal-text":
        dark
          ? "#f2f5ef"
          : "#182016",

      "--portal-muted":
        dark
          ? "rgba(242,245,239,0.50)"
          : "rgba(24,32,22,0.47)",

      "--portal-faint":
        dark
          ? "rgba(242,245,239,0.28)"
          : "rgba(24,32,22,0.27)",

      "--portal-border":
        dark
          ? "rgba(255,255,255,0.075)"
          : "rgba(20,30,16,0.065)",

      "--portal-border-strong":
        dark
          ? "rgba(255,255,255,0.12)"
          : "rgba(20,30,16,0.10)",

      "--portal-green":
        dark
          ? "#8dc56a"
          : "#426c2b",

      "--portal-green-2":
        dark
          ? "#a4d782"
          : "#5f8d41",

      "--portal-green-soft":
        dark
          ? "rgba(128,181,89,0.12)"
          : "#edf5e7",

      "--portal-green-soft-2":
        dark
          ? "rgba(128,181,89,0.18)"
          : "#e5f0dd",

      "--portal-shadow":
        dark
          ? "rgba(0,0,0,0.28)"
          : "rgba(31,45,23,0.06)",
    };

  /* =======================================================
     LOAD
     ======================================================= */

  async function loadPortalData() {
    const [
      dashboardResult,
      reportsResult,
      trainingResult,
      resourcesResult,
    ] =
      await Promise.all([
        getRepresentativeDashboard(),

        getRepresentativeReports(),

        getRepresentativeTraining(),

        getRepresentativeResources(),
      ]);

    setDashboard(
      dashboardResult,
    );

    setReports(
      reportsResult,
    );

    setTraining(
      trainingResult,
    );

    setResources(
      resourcesResult,
    );
  }

  useEffect(
    () => {
      let cancelled =
        false;

      void getCurrentRepresentative()
        .then(
          async (
            currentUser,
          ) => {
            if (
              cancelled
            ) {
              return;
            }

            if (
              !currentUser
            ) {
              router.replace(
                "/representative/login",
              );

              return;
            }

            if (
              currentUser
                .mustChangePassword
            ) {
              router.replace(
                "/representative/change-password",
              );

              return;
            }

            const [
              dashboardResult,
              reportsResult,
              trainingResult,
              resourcesResult,
            ] =
              await Promise.all([
                getRepresentativeDashboard(),

                getRepresentativeReports(),

                getRepresentativeTraining(),

                getRepresentativeResources(),
              ]);

            if (
              cancelled
            ) {
              return;
            }

            setUser(
              currentUser,
            );

            setDashboard(
              dashboardResult,
            );

            setReports(
              reportsResult,
            );

            setTraining(
              trainingResult,
            );

            setResources(
              resourcesResult,
            );

            setLoading(
              false,
            );
          },
        )
        .catch(
          (
            loadError,
          ) => {
            if (
              cancelled
            ) {
              return;
            }

            setError(
              loadError instanceof
                Error
                ? loadError.message
                : "Unable to load portal.",
            );

            setLoading(
              false,
            );
          },
        );

      return () => {
        cancelled =
          true;
      };
    },
    [
      router,
    ],
  );

  /* =======================================================
     NAVIGATION
     ======================================================= */

  const navItems =
    useMemo(
      () => [
        {
          key:
            "dashboard" as const,

          label:
            "Home",

          description:
            "Sales overview",

          icon:
            <DashboardIcon />,
        },

        {
          key:
            "reports" as const,

          label:
            "My Leads",

          description:
            "Reports & prospects",

          icon:
            <ReportIcon />,
        },

        {
          key:
            "training" as const,

          label:
            "Learn",

          description:
            "Training modules",

          icon:
            <TrainingIcon />,
        },

        {
          key:
            "resources" as const,

          label:
            "Sales Kit",

          description:
            "Rules & resources",

          icon:
            <ResourceIcon />,
        },

        {
          key:
            "account" as const,

          label:
            "Profile",

          description:
            "Account & security",

          icon:
            <UserIcon />,
        },
      ],
      [],
    );

  function navigate(
    tab:
      PortalTab,
  ) {
    setActiveTab(
      tab,
    );

    setMenuOpen(
      false,
    );

    setError(
      "",
    );

    window.scrollTo({
      top:
        0,

      behavior:
        "smooth",
    });
  }

  function openReport() {
    setError(
      "",
    );

    setReportOpen(
      true,
    );
  }

  function toggleTheme() {
    saveTheme(
      dark
        ? "light"
        : "dark",
    );
  }

  /* =======================================================
     REPORT
     ======================================================= */

  async function submitReport(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      reportSaving
    ) {
      return;
    }

    if (
      reportForm.title
        .trim()
        .length <
        3 ||
      reportForm
        .businessName
        .trim()
        .length <
        2 ||
      reportForm.details
        .trim()
        .length <
        20
    ) {
      setError(
        "Enter a title, business name and at least 20 characters of report details.",
      );

      return;
    }

    const budgetText =
      reportForm
        .estimatedBudget
        .trim();

    const budget =
      budgetText
        ? Number(
            budgetText,
          )
        : null;

    if (
      budget !==
        null &&
      (
        !Number.isFinite(
          budget,
        ) ||
        budget <
          0
      )
    ) {
      setError(
        "Enter a valid estimated budget.",
      );

      return;
    }

    setReportSaving(
      true,
    );

    setError(
      "",
    );

    try {
      await createRepresentativeReport({
        category:
          reportForm.category,

        title:
          reportForm.title.trim(),

        businessName:
          reportForm
            .businessName
            .trim(),

        contactName:
          reportForm
            .contactName
            .trim(),

        clientPhone:
          reportForm
            .clientPhone
            .trim(),

        clientEmail:
          reportForm
            .clientEmail
            .trim(),

        estimatedBudget:
          budget,

        details:
          reportForm.details.trim(),
      });

      setReportForm({
        category:
          "lead",

        title:
          "",

        businessName:
          "",

        contactName:
          "",

        clientPhone:
          "",

        clientEmail:
          "",

        estimatedBudget:
          "",

        details:
          "",
      });

      setReportOpen(
        false,
      );

      await loadPortalData();

      setActiveTab(
        "reports",
      );
    } catch (
      submitError
    ) {
      setError(
        submitError instanceof
          Error
          ? submitError.message
          : "Unable to submit report.",
      );
    } finally {
      setReportSaving(
        false,
      );
    }
  }

  /* =======================================================
     TRAINING
     ======================================================= */

  async function completeTraining(
    id:
      string,
  ) {
    if (
      completingTraining
    ) {
      return;
    }

    setCompletingTraining(
      id,
    );

    setError(
      "",
    );

    try {
      await completeRepresentativeTraining(
        id,
      );

      await loadPortalData();
    } catch (
      completeError
    ) {
      setError(
        completeError instanceof
          Error
          ? completeError.message
          : "Unable to update training.",
      );
    } finally {
      setCompletingTraining(
        null,
      );
    }
  }

  /* =======================================================
     LOGOUT
     ======================================================= */

  async function logout() {
    try {
      await logoutRepresentative();
    } finally {
      router.replace(
        "/representative/login",
      );

      router.refresh();
    }
  }

  /* =======================================================
     DERIVED DATA
     ======================================================= */

  const firstName =
    user
      ?.name
      ?.trim()
      .split(
        /\s+/,
      )[0] ||
    user?.username ||
    "Partner";

  const trainingProgress =
    dashboard &&
    dashboard.training.total >
      0
      ? Math.round(
          (
            dashboard.training.completed /
            dashboard.training.total
          ) *
            100,
        )
      : 0;

  /* =======================================================
     LOADING
     ======================================================= */

  if (
    loading
  ) {
    return (
      <main
        style={
          portalStyle
        }
        className="flex min-h-screen items-center justify-center bg-[var(--portal-bg)] text-[var(--portal-text)] transition-colors duration-300"
      >
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] border border-[var(--portal-border)] bg-[var(--portal-surface)] shadow-[0_18px_45px_var(--portal-shadow)]">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--portal-border-strong)] border-t-[var(--portal-green)]" />
          </div>

          <span className="mt-5 block text-[7px] font-black uppercase tracking-[0.2em] text-[var(--portal-faint)]">
            Opening Sales Hub
          </span>
        </div>
      </main>
    );
  }

  if (
    !user
  ) {
    return null;
  }

  /* =======================================================
     PAGE DESCRIPTION
     ======================================================= */

  const pageDescription =
    activeTab ===
    "dashboard"
      ? "Everything you need to find prospects, build confidence and move qualified leads forward."
      : activeTab ===
          "reports"
        ? "Keep your prospects organized and send qualified opportunities directly for review."
        : activeTab ===
            "training"
          ? "Sharpen your sales knowledge and learn how to represent Baki Digital professionally."
          : activeTab ===
              "resources"
            ? "Quick access to sales rules, pricing guidance and useful material while speaking with prospects."
            : "Manage your partner profile and keep your account secure.";

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <main
      style={
        portalStyle
      }
      className="min-h-screen bg-[var(--portal-bg)] text-[var(--portal-text)] transition-colors duration-300"
    >
      {/* ===================================================
          MOBILE TOP BAR
          =================================================== */}

      <header className="sticky top-0 z-50 flex h-[68px] items-center justify-between border-b border-[var(--portal-border)] bg-[var(--portal-bg)]/90 px-4 backdrop-blur-2xl lg:hidden">
        <button
          type="button"
          onClick={() =>
            navigate(
              "dashboard",
            )
          }
          className="flex items-center gap-3"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--portal-green)] text-[9px] font-black text-white shadow-[0_8px_20px_rgba(66,108,43,0.18)]">
            &lt;/&gt;
          </span>

          <div className="text-left">
            <strong className="block text-[11px] font-black tracking-[-0.03em]">
              Baki Sales
            </strong>

            <span className="block text-[6px] font-bold uppercase tracking-[0.15em] text-[var(--portal-faint)]">
              Partner Hub
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={
              dark
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            onClick={
              toggleTheme
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface)] text-[var(--portal-muted)] transition hover:text-[var(--portal-green)]"
          >
            <span className="h-[17px] w-[17px]">
              {dark
                ? <SunIcon />
                : <MoonIcon />}
            </span>
          </button>

          <button
            type="button"
            aria-label="Open navigation"
            onClick={() =>
              setMenuOpen(
                (
                  current,
                ) =>
                  !current,
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface)]"
          >
            <span className="h-[17px] w-[17px]">
              {menuOpen
                ? <CloseIcon />
                : <MenuIcon />}
            </span>
          </button>
        </div>
      </header>

      <div className="mx-auto flex min-h-screen max-w-[1900px]">
        {/* =================================================
            SIDEBAR
            ================================================= */}

        <aside
          className={`fixed inset-y-0 left-0 z-40 w-[278px] border-r border-[var(--portal-border)] bg-[var(--portal-sidebar)] px-4 py-5 shadow-[18px_0_50px_rgba(0,0,0,0.02)] transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
            menuOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            {/* BRAND */}

            <div className="flex items-center gap-3 px-2">
              <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[16px] bg-[var(--portal-green)] text-[12px] font-black text-white shadow-[0_12px_30px_rgba(66,108,43,0.22)]">
                <span className="relative z-10">
                  &lt;/&gt;
                </span>

                <span className="absolute -right-3 -top-3 h-8 w-8 rounded-full bg-white/10" />
              </span>

              <div>
                <strong className="block text-[13px] font-black tracking-[-0.035em]">
                  Baki Digital
                </strong>

                <span className="mt-0.5 block text-[6.5px] font-black uppercase tracking-[0.16em] text-[var(--portal-faint)]">
                  Sales Partner Hub
                </span>
              </div>
            </div>

            {/* PARTNER CHIP */}

            <div className="mt-7 rounded-[19px] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-3.5 shadow-[0_12px_35px_var(--portal-shadow)]">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--portal-green-soft)] text-[var(--portal-green)]">
                  <span className="h-4 w-4">
                    <SparkIcon />
                  </span>
                </span>

                <div className="min-w-0">
                  <span className="block text-[6px] font-black uppercase tracking-[0.14em] text-[var(--portal-faint)]">
                    Partner ID
                  </span>

                  <strong className="mt-1 block truncate text-[10px] font-black text-[var(--portal-green)]">
                    {
                      user.username
                    }
                  </strong>
                </div>
              </div>
            </div>

            {/* NAV */}

            <div className="mt-8 px-2">
              <span className="text-[6px] font-black uppercase tracking-[0.19em] text-[var(--portal-faint)]">
                Your workspace
              </span>
            </div>

            <nav className="mt-3 space-y-1.5">
              {navItems.map(
                (
                  item,
                ) => {
                  const active =
                    item.key ===
                    activeTab;

                  return (
                    <button
                      key={
                        item.key
                      }
                      type="button"
                      onClick={() =>
                        navigate(
                          item.key,
                        )
                      }
                      className={`group flex min-h-[52px] w-full items-center gap-3 rounded-[15px] px-3.5 text-left transition duration-200 ${
                        active
                          ? "bg-[var(--portal-green-soft)] text-[var(--portal-green)]"
                          : "text-[var(--portal-muted)] hover:bg-[var(--portal-surface)] hover:text-[var(--portal-text)]"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] transition ${
                          active
                            ? "bg-[var(--portal-surface)] shadow-sm"
                            : "group-hover:bg-[var(--portal-surface-2)]"
                        }`}
                      >
                        <span className="h-[16px] w-[16px]">
                          {
                            item.icon
                          }
                        </span>
                      </span>

                      <span className="min-w-0">
                        <strong className="block text-[8.5px] font-extrabold">
                          {
                            item.label
                          }
                        </strong>

                        <span className="mt-0.5 block text-[6px] font-medium text-[var(--portal-faint)]">
                          {
                            item.description
                          }
                        </span>
                      </span>

                      {active && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--portal-green)]" />
                      )}
                    </button>
                  );
                },
              )}
            </nav>

            {/* COMMISSION MINI CARD */}

            <div className="mt-7 rounded-[18px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] p-4">
              <span className="text-[6px] font-black uppercase tracking-[0.16em] text-[var(--portal-faint)]">
                Your commission
              </span>

              <div className="mt-3 flex items-end justify-between gap-2">
                <strong className="text-[24px] font-black tracking-[-0.05em] text-[var(--portal-green)]">
                  20–25%
                </strong>

                <span className="mb-1 text-[6px] font-bold text-[var(--portal-muted)]">
                  per sale
                </span>
              </div>

              <p className="mt-2 text-[6.5px] leading-4 text-[var(--portal-muted)]">
                Earn after a qualifying customer payment is confirmed.
              </p>
            </div>

            {/* BOTTOM */}

            <div className="mt-auto pt-5">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "account",
                  )
                }
                className="flex w-full items-center gap-3 rounded-[16px] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-3 text-left transition hover:border-[var(--portal-border-strong)]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--portal-green-soft)] text-[var(--portal-green)]">
                  <span className="h-4 w-4">
                    <UserIcon />
                  </span>
                </span>

                <span className="min-w-0">
                  <strong className="block truncate text-[8.5px] font-black">
                    {
                      user.name
                    }
                  </strong>

                  <span className="mt-0.5 block truncate text-[6px] font-bold text-[var(--portal-faint)]">
                    {
                      user.email
                    }
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  void logout()
                }
                className="mt-2 flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[7.5px] font-extrabold text-red-400 transition hover:bg-red-500/10"
              >
                <span className="h-4 w-4">
                  <LogoutIcon />
                </span>

                Log out
              </button>
            </div>
          </div>
        </aside>

        {menuOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() =>
              setMenuOpen(
                false,
              )
            }
            className="fixed inset-0 z-30 bg-black/35 backdrop-blur-[2px] lg:hidden"
          />
        )}

        {/* =================================================
            CONTENT
            ================================================= */}

        <section className="min-w-0 flex-1 px-4 pb-12 pt-6 sm:px-7 lg:px-10 lg:pb-16 lg:pt-8 xl:px-14">
          <div className="mx-auto max-w-[1360px]">
            {/* =============================================
                TOP BAR
                ============================================= */}

            <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--portal-green)] shadow-[0_0_10px_rgba(110,164,77,0.5)]" />

                  <span className="text-[6.5px] font-black uppercase tracking-[0.18em] text-[var(--portal-green-2)]">
                    {
                      user.username
                    }
                  </span>
                </div>

                <h1 className="mt-2.5 text-[30px] font-black tracking-[-0.055em] sm:text-[38px] lg:text-[42px]">
                  {activeTab ===
                  "dashboard"
                    ? `Hey ${firstName},`
                    : navItems.find(
                        (
                          item,
                        ) =>
                          item.key ===
                          activeTab,
                      )?.label}
                </h1>

                <p className="mt-2 max-w-[590px] text-[8.5px] leading-5 text-[var(--portal-muted)] sm:text-[9px]">
                  {
                    pageDescription
                  }
                </p>
              </div>

              <div className="hidden items-center gap-2 lg:flex">
                <button
                  type="button"
                  onClick={
                    toggleTheme
                  }
                  className="flex h-11 items-center gap-2.5 rounded-[14px] border border-[var(--portal-border)] bg-[var(--portal-surface)] px-4 text-[7.5px] font-extrabold text-[var(--portal-muted)] shadow-[0_8px_25px_var(--portal-shadow)] transition hover:text-[var(--portal-text)]"
                >
                  <span className="h-4 w-4">
                    {dark
                      ? <SunIcon />
                      : <MoonIcon />}
                  </span>

                  {dark
                    ? "Light mode"
                    : "Dark mode"}
                </button>

                {(activeTab ===
                  "dashboard" ||
                  activeTab ===
                    "reports") && (
                  <button
                    type="button"
                    onClick={
                      openReport
                    }
                    className="flex h-11 items-center gap-2.5 rounded-[14px] bg-[var(--portal-green)] px-5 text-[7.5px] font-extrabold text-white shadow-[0_12px_28px_rgba(66,108,43,0.22)] transition hover:-translate-y-0.5"
                  >
                    <span className="h-4 w-4">
                      <PlusIcon />
                    </span>

                    Report a Lead
                  </button>
                )}
              </div>
            </header>

            {/* MOBILE REPORT BUTTON */}

            {(activeTab ===
              "dashboard" ||
              activeTab ===
                "reports") && (
              <button
                type="button"
                onClick={
                  openReport
                }
                className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-[var(--portal-green)] text-[8px] font-extrabold text-white shadow-[0_10px_25px_rgba(66,108,43,0.18)] lg:hidden"
              >
                <span className="h-4 w-4">
                  <PlusIcon />
                </span>

                Report a Lead
              </button>
            )}

            {/* ERROR */}

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-[14px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-[8px] font-medium leading-5 text-red-400"
              >
                {
                  error
                }
              </div>
            )}

            {/* =============================================
                DASHBOARD
                ============================================= */}

            {activeTab ===
              "dashboard" &&
              dashboard && (
                <>
                  {/* HERO */}

                  <section className="relative mt-7 overflow-hidden rounded-[28px] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5 shadow-[0_20px_60px_var(--portal-shadow)] sm:p-7 lg:p-8">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-20 -top-24 h-[260px] w-[260px] rounded-full bg-[var(--portal-green-soft-2)] blur-[20px]"
                    />

                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute bottom-[-110px] left-[34%] h-[220px] w-[220px] rounded-full bg-[var(--portal-green-soft)] blur-[40px]"
                    />

                    <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                      <div>
                        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-3 py-2 text-[6px] font-black uppercase tracking-[0.15em] text-[var(--portal-green)]">
                          <span className="h-3.5 w-3.5">
                            <SparkIcon />
                          </span>

                          Your Sales Workspace
                        </span>

                        <h2 className="mt-5 max-w-[560px] text-[27px] font-black leading-[1.04] tracking-[-0.055em] sm:text-[34px] lg:text-[40px]">
                          Find the right client.
                          <br />

                          <span className="text-[var(--portal-green)]">
                            We handle the technical side.
                          </span>
                        </h2>

                        <p className="mt-4 max-w-[550px] text-[8.5px] leading-5 text-[var(--portal-muted)] sm:text-[9px]">
                          Focus on finding qualified businesses and starting the conversation. When they become serious, hand the lead over and keep everything organized here.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-2.5">
                          <button
                            type="button"
                            onClick={
                              openReport
                            }
                            className="flex h-11 items-center gap-2 rounded-[13px] bg-[var(--portal-green)] px-5 text-[7.5px] font-extrabold text-white"
                          >
                            <span className="h-4 w-4">
                              <PlusIcon />
                            </span>

                            New Lead
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                "training",
                              )
                            }
                            className="flex h-11 items-center gap-2 rounded-[13px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-5 text-[7.5px] font-extrabold"
                          >
                            Continue Training

                            <span className="h-3.5 w-3.5">
                              <ArrowRightIcon />
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* TRAINING PROGRESS */}

                      <div className="rounded-[22px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-5">
                          <div>
                            <span className="text-[6px] font-black uppercase tracking-[0.15em] text-[var(--portal-faint)]">
                              Training progress
                            </span>

                            <strong className="mt-2 block text-[27px] font-black tracking-[-0.05em]">
                              {
                                trainingProgress
                              }
                              %
                            </strong>
                          </div>

                          <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--portal-green-soft)] text-[var(--portal-green)]">
                            <span className="h-5 w-5">
                              <TrainingIcon />
                            </span>
                          </span>
                        </div>

                        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--portal-border)]">
                          <div
                            className="h-full rounded-full bg-[var(--portal-green)] transition-all duration-500"
                            style={{
                              width:
                                `${trainingProgress}%`,
                            }}
                          />
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[6.5px] text-[var(--portal-muted)]">
                            {
                              dashboard
                                .training
                                .completed
                            }{" "}
                            complete
                          </span>

                          <span className="text-[6.5px] text-[var(--portal-muted)]">
                            {
                              dashboard
                                .training
                                .total
                            }{" "}
                            modules
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* METRICS */}

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <article className="group rounded-[22px] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5 shadow-[0_10px_35px_var(--portal-shadow)] transition hover:-translate-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--portal-green-soft)] text-[var(--portal-green)]">
                          <span className="h-4 w-4">
                            <ReportIcon />
                          </span>
                        </span>

                        <span className="text-[6px] font-black uppercase tracking-[0.14em] text-[var(--portal-faint)]">
                          All time
                        </span>
                      </div>

                      <strong className="mt-5 block text-[29px] font-black tracking-[-0.05em]">
                        {
                          dashboard
                            .reports
                            .total
                        }
                      </strong>

                      <span className="mt-1 block text-[7px] font-bold text-[var(--portal-muted)]">
                        Reports submitted
                      </span>
                    </article>

                    <article className="group rounded-[22px] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5 shadow-[0_10px_35px_var(--portal-shadow)] transition hover:-translate-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                          <span className="h-4 w-4">
                            <TargetIcon />
                          </span>
                        </span>

                        <span className="h-2 w-2 rounded-full bg-blue-400" />
                      </div>

                      <strong className="mt-5 block text-[29px] font-black tracking-[-0.05em]">
                        {
                          dashboard
                            .reports
                            .active
                        }
                      </strong>

                      <span className="mt-1 block text-[7px] font-bold text-[var(--portal-muted)]">
                        Active opportunities
                      </span>
                    </article>

                    <article className="group rounded-[22px] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5 shadow-[0_10px_35px_var(--portal-shadow)] transition hover:-translate-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                          <span className="h-4 w-4">
                            <TrophyIcon />
                          </span>
                        </span>

                        <span className="text-[6px] font-black uppercase tracking-[0.14em] text-[var(--portal-faint)]">
                          Closed
                        </span>
                      </div>

                      <strong className="mt-5 block text-[29px] font-black tracking-[-0.05em]">
                        {
                          dashboard
                            .reports
                            .won
                        }
                      </strong>

                      <span className="mt-1 block text-[7px] font-bold text-[var(--portal-muted)]">
                        Successful sales
                      </span>
                    </article>

                    <article className="group rounded-[22px] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5 shadow-[0_10px_35px_var(--portal-shadow)] transition hover:-translate-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--portal-green-soft)] text-[var(--portal-green)]">
                          <span className="h-4 w-4">
                            <UserIcon />
                          </span>
                        </span>

                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.55)]" />
                      </div>

                      <strong className="mt-5 block text-[20px] font-black tracking-[-0.04em] text-[var(--portal-green)]">
                        {
                          user.username
                        }
                      </strong>

                      <span className="mt-1 block text-[7px] font-bold text-[var(--portal-muted)]">
                        Active Partner account
                      </span>
                    </article>
                  </div>

                  {/* RECENT + RULES */}

                  <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
                    <section className="rounded-[24px] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5 shadow-[0_12px_40px_var(--portal-shadow)] sm:p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <span className="text-[6px] font-black uppercase tracking-[0.16em] text-[var(--portal-green)]">
                            Recent activity
                          </span>

                          <h2 className="mt-1.5 text-[14px] font-black tracking-[-0.035em]">
                            Your latest leads
                          </h2>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              "reports",
                            )
                          }
                          className="flex items-center gap-1.5 text-[7px] font-extrabold text-[var(--portal-green)]"
                        >
                          See all

                          <span className="h-3 w-3">
                            <ArrowUpRightIcon />
                          </span>
                        </button>
                      </div>

                      <div className="mt-5 space-y-2.5">
                        {dashboard
                          .recentReports
                          .length ===
                        0 ? (
                          <div className="flex min-h-[140px] flex-col items-center justify-center rounded-[17px] border border-dashed border-[var(--portal-border-strong)] bg-[var(--portal-surface-2)] px-4 text-center">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--portal-green-soft)] text-[var(--portal-green)]">
                              <span className="h-4 w-4">
                                <TargetIcon />
                              </span>
                            </span>

                            <strong className="mt-3 text-[8.5px]">
                              No leads yet
                            </strong>

                            <p className="mt-1 text-[6.5px] text-[var(--portal-muted)]">
                              Your submitted prospects will appear here.
                            </p>
                          </div>
                        ) : (
                          dashboard
                            .recentReports
                            .map(
                              (
                                report,
                              ) => (
                                <div
                                  key={
                                    report.id
                                  }
                                  className="flex items-center gap-3 rounded-[16px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-4 py-3.5"
                                >
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--portal-green-soft)] text-[var(--portal-green)]">
                                    <span className="h-4 w-4">
                                      <ReportIcon />
                                    </span>
                                  </span>

                                  <div className="min-w-0 flex-1">
                                    <strong className="block truncate text-[8.5px] font-black">
                                      {
                                        report.businessName
                                      }
                                    </strong>

                                    <span className="mt-1 block truncate text-[6.5px] text-[var(--portal-muted)]">
                                      {
                                        report.title
                                      }
                                    </span>
                                  </div>

                                  <span
                                    className={`shrink-0 rounded-full px-2.5 py-1.5 text-[5.5px] font-black uppercase tracking-[0.08em] ${reportStatusClass(
                                      report.status,
                                      dark,
                                    )}`}
                                  >
                                    {
                                      report.status
                                    }
                                  </span>
                                </div>
                              ),
                            )
                        )}
                      </div>
                    </section>

                    <section className="relative overflow-hidden rounded-[24px] border border-[var(--portal-border)] bg-[var(--portal-green-soft)] p-6">
                      <div
                        aria-hidden="true"
                        className="absolute -right-14 -top-14 h-36 w-36 rounded-full border border-[var(--portal-green)]/10"
                      />

                      <div
                        aria-hidden="true"
                        className="absolute -right-7 -top-7 h-24 w-24 rounded-full border border-[var(--portal-green)]/10"
                      />

                      <span className="relative flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--portal-surface)] text-[var(--portal-green)] shadow-sm">
                        <span className="h-5 w-5">
                          <ShieldIcon />
                        </span>
                      </span>

                      <span className="relative mt-6 block text-[6px] font-black uppercase tracking-[0.17em] text-[var(--portal-green)]">
                        Partner principle
                      </span>

                      <h2 className="relative mt-2.5 text-[20px] font-black leading-tight tracking-[-0.045em]">
                        Protect the customer&apos;s trust.
                      </h2>

                      <p className="relative mt-3 text-[7.5px] leading-5 text-[var(--portal-muted)]">
                        Never collect customer money, invent features, promise unapproved prices or guarantee delivery dates.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            "resources",
                          )
                        }
                        className="relative mt-6 flex h-10 items-center gap-2 rounded-xl bg-[var(--portal-surface)] px-4 text-[7px] font-extrabold text-[var(--portal-green)]"
                      >
                        Open Sales Kit

                        <span className="h-3.5 w-3.5">
                          <ArrowRightIcon />
                        </span>
                      </button>
                    </section>
                  </div>
                </>
              )}

            {/* =============================================
                REPORTS
                ============================================= */}

            {activeTab ===
              "reports" && (
              <div className="mt-7">
                {reports.length ===
                0 ? (
                  <section className="flex min-h-[390px] flex-col items-center justify-center rounded-[26px] border border-[var(--portal-border)] bg-[var(--portal-surface)] px-5 text-center shadow-[0_15px_45px_var(--portal-shadow)]">
                    <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--portal-green-soft)] text-[var(--portal-green)]">
                      <span className="h-7 w-7">
                        <TargetIcon />
                      </span>
                    </span>

                    <span className="mt-6 text-[6px] font-black uppercase tracking-[0.18em] text-[var(--portal-green)]">
                      Your pipeline starts here
                    </span>

                    <h2 className="mt-2 text-[22px] font-black tracking-[-0.045em]">
                      No leads submitted yet.
                    </h2>

                    <p className="mt-2 max-w-[400px] text-[7.5px] leading-5 text-[var(--portal-muted)]">
                      When you find a serious prospect, create a report so the opportunity can be reviewed and attributed to you.
                    </p>

                    <button
                      type="button"
                      onClick={
                        openReport
                      }
                      className="mt-6 flex h-11 items-center gap-2 rounded-[13px] bg-[var(--portal-green)] px-5 text-[7.5px] font-extrabold text-white"
                    >
                      <span className="h-4 w-4">
                        <PlusIcon />
                      </span>

                      Report First Lead
                    </button>
                  </section>
                ) : (
                  <div className="grid gap-3">
                    {reports.map(
                      (
                        report,
                      ) => (
                        <article
                          key={
                            report.id
                          }
                          className="rounded-[22px] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-4 shadow-[0_10px_35px_var(--portal-shadow)] transition hover:border-[var(--portal-border-strong)] sm:p-5"
                        >
                          <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[var(--portal-green-soft)] text-[var(--portal-green)]">
                              <span className="h-5 w-5">
                                <TargetIcon />
                              </span>
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2.5">
                                <strong className="text-[11px] font-black tracking-[-0.02em]">
                                  {
                                    report.businessName
                                  }
                                </strong>

                                <span
                                  className={`rounded-full px-2.5 py-1 text-[5.5px] font-black uppercase tracking-[0.08em] ${reportStatusClass(
                                    report.status,
                                    dark,
                                  )}`}
                                >
                                  {
                                    report.status
                                  }
                                </span>
                              </div>

                              <h3 className="mt-2 text-[8px] font-bold text-[var(--portal-muted)]">
                                {
                                  report.title
                                }
                              </h3>

                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[6px] font-medium text-[var(--portal-faint)]">
                                <span>
                                  {
                                    formatDate(
                                      report.createdAt,
                                    )
                                  }
                                </span>

                                <span>
                                  {
                                    report.category.replace(
                                      "_",
                                      " ",
                                    )
                                  }
                                </span>
                              </div>
                            </div>

                            {report.estimatedBudget !==
                              null && (
                              <div className="rounded-[14px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-4 py-3 lg:min-w-[145px] lg:text-right">
                                <span className="block text-[5.5px] font-bold uppercase tracking-[0.1em] text-[var(--portal-faint)]">
                                  Estimated budget
                                </span>

                                <strong className="mt-1 block text-[10px] font-black text-[var(--portal-green)]">
                                  ETB{" "}
                                  {
                                    report
                                      .estimatedBudget
                                      .toLocaleString()
                                  }
                                </strong>
                              </div>
                            )}
                          </div>

                          <p className="mt-4 border-t border-[var(--portal-border)] pt-4 text-[7.5px] leading-5 text-[var(--portal-muted)]">
                            {
                              report.details
                            }
                          </p>
                        </article>
                      ),
                    )}
                  </div>
                )}
              </div>
            )}

            {/* =============================================
                TRAINING
                ============================================= */}

            {activeTab ===
              "training" && (
              <>
                <section className="mt-7 flex flex-col gap-4 rounded-[24px] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5 shadow-[0_12px_40px_var(--portal-shadow)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div>
                    <span className="text-[6px] font-black uppercase tracking-[0.17em] text-[var(--portal-green)]">
                      Your progress
                    </span>

                    <h2 className="mt-2 text-[18px] font-black tracking-[-0.04em]">
                      Build confidence before you sell.
                    </h2>
                  </div>

                  <div className="min-w-[220px]">
                    <div className="flex items-center justify-between text-[6.5px] font-bold text-[var(--portal-muted)]">
                      <span>
                        {
                          dashboard
                            ?.training
                            .completed ??
                          0
                        }{" "}
                        completed
                      </span>

                      <span>
                        {
                          trainingProgress
                        }
                        %
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--portal-border)]">
                      <div
                        className="h-full rounded-full bg-[var(--portal-green)]"
                        style={{
                          width:
                            `${trainingProgress}%`,
                        }}
                      />
                    </div>
                  </div>
                </section>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  {training.map(
                    (
                      module,
                    ) => {
                      const youtubeUrl =
                        getYouTubeEmbedUrl(
                          module.videoUrl,
                        );

                      return (
                        <article
                          key={
                            module.id
                          }
                          className="overflow-hidden rounded-[24px] border border-[var(--portal-border)] bg-[var(--portal-surface)] shadow-[0_12px_40px_var(--portal-shadow)]"
                        >
                          {youtubeUrl ? (
                            <div className="aspect-video bg-black">
                              <iframe
                                src={
                                  youtubeUrl
                                }
                                title={
                                  module.title
                                }
                                className="h-full w-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          ) : module.videoUrl ? (
                            <video
                              controls
                              preload="metadata"
                              src={
                                module.videoUrl
                              }
                              className="aspect-video w-full bg-black"
                            />
                          ) : (
                            <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-[var(--portal-surface-3)]">
                              <div className="absolute h-36 w-36 rounded-full bg-[var(--portal-green-soft-2)] blur-[35px]" />

                              <span className="relative flex h-16 w-16 items-center justify-center rounded-[20px] border border-[var(--portal-border)] bg-[var(--portal-surface)] text-[var(--portal-green)] shadow-lg">
                                <span className="h-7 w-7">
                                  <TrainingIcon />
                                </span>
                              </span>
                            </div>
                          )}

                          <div className="p-5 sm:p-6">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[6px] font-black uppercase tracking-[0.15em] text-[var(--portal-green)]">
                                {
                                  module.durationMinutes
                                }{" "}
                                min lesson
                              </span>

                              {module.completed && (
                                <span className="flex items-center gap-1.5 rounded-full bg-[var(--portal-green-soft)] px-2.5 py-1.5 text-[5.5px] font-black uppercase text-[var(--portal-green)]">
                                  <span className="h-3 w-3">
                                    <CheckIcon />
                                  </span>

                                  Complete
                                </span>
                              )}
                            </div>

                            <h2 className="mt-3 text-[17px] font-black tracking-[-0.04em]">
                              {
                                module.title
                              }
                            </h2>

                            <p className="mt-2 text-[7.5px] leading-5 text-[var(--portal-muted)]">
                              {
                                module.description
                              }
                            </p>

                            <div className="mt-4 rounded-[16px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] p-4 text-[7.5px] leading-5 text-[var(--portal-muted)]">
                              {
                                module.content
                              }
                            </div>

                            <button
                              type="button"
                              disabled={
                                module.completed ||
                                completingTraining ===
                                  module.id
                              }
                              onClick={() =>
                                void completeTraining(
                                  module.id,
                                )
                              }
                              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[13px] bg-[var(--portal-green)] text-[7.5px] font-extrabold text-white transition disabled:bg-[var(--portal-green-soft)] disabled:text-[var(--portal-green)]"
                            >
                              {module.completed ? (
                                <>
                                  <span className="h-4 w-4">
                                    <CheckIcon />
                                  </span>

                                  Completed
                                </>
                              ) : completingTraining ===
                                module.id ? (
                                "Saving..."
                              ) : (
                                "Mark as Complete"
                              )}
                            </button>
                          </div>
                        </article>
                      );
                    },
                  )}
                </div>
              </>
            )}

            {/* =============================================
                RESOURCES
                ============================================= */}

            {activeTab ===
              "resources" && (
              <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {resources.map(
                  (
                    resource,
                  ) => (
                    <article
                      key={
                        resource.id
                      }
                      className="group flex flex-col rounded-[24px] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5 shadow-[0_12px_40px_var(--portal-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--portal-border-strong)] sm:p-6"
                    >
                      <div className="flex items-start justify-between">
                        <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--portal-green-soft)] text-[var(--portal-green)]">
                          <span className="h-[18px] w-[18px]">
                            <ResourceIcon />
                          </span>
                        </span>

                        {resource.externalUrl && (
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--portal-border)] text-[var(--portal-faint)] transition group-hover:text-[var(--portal-green)]">
                            <span className="h-3.5 w-3.5">
                              <ArrowUpRightIcon />
                            </span>
                          </span>
                        )}
                      </div>

                      <span className="mt-6 text-[5.5px] font-black uppercase tracking-[0.17em] text-[var(--portal-green)]">
                        {
                          resource.category
                        }
                      </span>

                      <h2 className="mt-2 text-[17px] font-black tracking-[-0.04em]">
                        {
                          resource.title
                        }
                      </h2>

                      <p className="mt-2 text-[7.5px] leading-5 text-[var(--portal-muted)]">
                        {
                          resource.description
                        }
                      </p>

                      <div className="mt-4 flex-1 rounded-[16px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] p-4 text-[7.5px] leading-5 text-[var(--portal-muted)]">
                        {
                          resource.content
                        }
                      </div>

                      {resource.externalUrl && (
                        <a
                          href={
                            resource.externalUrl
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-5 flex items-center gap-2 text-[7px] font-extrabold text-[var(--portal-green)]"
                        >
                          Open resource

                          <span className="h-3.5 w-3.5">
                            <ArrowUpRightIcon />
                          </span>
                        </a>
                      )}
                    </article>
                  ),
                )}
              </div>
            )}

            {/* =============================================
                ACCOUNT
                ============================================= */}

            {activeTab ===
              "account" && (
              <div className="mt-7 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                <section className="overflow-hidden rounded-[26px] border border-[var(--portal-border)] bg-[var(--portal-surface)] shadow-[0_15px_50px_var(--portal-shadow)]">
                  <div className="relative overflow-hidden border-b border-[var(--portal-border)] bg-[var(--portal-green-soft)] p-6 sm:p-7">
                    <div
                      aria-hidden="true"
                      className="absolute -right-16 -top-16 h-40 w-40 rounded-full border border-[var(--portal-green)]/10"
                    />

                    <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--portal-surface)] text-[var(--portal-green)] shadow-sm">
                      <span className="h-6 w-6">
                        <UserIcon />
                      </span>
                    </span>

                    <span className="mt-5 block text-[6px] font-black uppercase tracking-[0.17em] text-[var(--portal-green)]">
                      Sales Partner
                    </span>

                    <h2 className="mt-2 text-[24px] font-black tracking-[-0.05em]">
                      {
                        user.name
                      }
                    </h2>

                    <p className="mt-1 text-[7px] font-bold text-[var(--portal-muted)]">
                      {
                        user.username
                      }
                    </p>
                  </div>

                  <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
                    {[
                      [
                        "Full name",
                        user.name,
                      ],

                      [
                        "Partner ID",
                        user.username,
                      ],

                      [
                        "Email address",
                        user.email,
                      ],

                      [
                        "Account type",
                        "Sales Partner",
                      ],
                    ].map(
                      (
                        [
                          label,
                          value,
                        ],
                      ) => (
                        <div
                          key={
                            label
                          }
                          className="rounded-[16px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-4 py-4"
                        >
                          <span className="text-[5.5px] font-black uppercase tracking-[0.14em] text-[var(--portal-faint)]">
                            {
                              label
                            }
                          </span>

                          <strong className="mt-2 block break-all text-[8.5px]">
                            {
                              value
                            }
                          </strong>
                        </div>
                      ),
                    )}
                  </div>
                </section>

                <div className="space-y-5">
                  {/* SECURITY */}

                  <section className="rounded-[24px] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5 shadow-[0_12px_40px_var(--portal-shadow)] sm:p-6">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--portal-green-soft)] text-[var(--portal-green)]">
                      <span className="h-5 w-5">
                        <LockIcon />
                      </span>
                    </span>

                    <h2 className="mt-5 text-[17px] font-black tracking-[-0.04em]">
                      Account security
                    </h2>

                    <p className="mt-2 text-[7.5px] leading-5 text-[var(--portal-muted)]">
                      Keep your password private and update it immediately if you believe another person may know it.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          "/representative/change-password",
                        )
                      }
                      className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[13px] bg-[var(--portal-green-soft)] text-[7.5px] font-extrabold text-[var(--portal-green)]"
                    >
                      Change Password

                      <span className="h-3.5 w-3.5">
                        <ArrowRightIcon />
                      </span>
                    </button>
                  </section>

                  {/* THEME */}

                  <section className="rounded-[24px] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5 shadow-[0_12px_40px_var(--portal-shadow)] sm:p-6">
                    <span className="text-[6px] font-black uppercase tracking-[0.16em] text-[var(--portal-green)]">
                      Appearance
                    </span>

                    <h2 className="mt-2 text-[15px] font-black">
                      Portal theme
                    </h2>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          saveTheme(
                            "light",
                          )
                        }
                        className={`flex h-12 items-center justify-center gap-2 rounded-[14px] border text-[7px] font-extrabold transition ${
                          !dark
                            ? "border-[var(--portal-green)] bg-[var(--portal-green-soft)] text-[var(--portal-green)]"
                            : "border-[var(--portal-border)] bg-[var(--portal-surface-2)] text-[var(--portal-muted)]"
                        }`}
                      >
                        <span className="h-4 w-4">
                          <SunIcon />
                        </span>

                        Light
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          saveTheme(
                            "dark",
                          )
                        }
                        className={`flex h-12 items-center justify-center gap-2 rounded-[14px] border text-[7px] font-extrabold transition ${
                          dark
                            ? "border-[var(--portal-green)] bg-[var(--portal-green-soft)] text-[var(--portal-green)]"
                            : "border-[var(--portal-border)] bg-[var(--portal-surface-2)] text-[var(--portal-muted)]"
                        }`}
                      >
                        <span className="h-4 w-4">
                          <MoonIcon />
                        </span>

                        Dark
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        void logout()
                      }
                      className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[13px] border border-red-400/20 bg-red-500/10 text-[7.5px] font-extrabold text-red-400"
                    >
                      <span className="h-4 w-4">
                        <LogoutIcon />
                      </span>

                      Log Out
                    </button>
                  </section>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ===================================================
          NEW REPORT MODAL
          =================================================== */}

      {reportOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4 py-5 backdrop-blur-[7px]">
          <button
            type="button"
            aria-label="Close report form"
            onClick={() =>
              !reportSaving &&
              setReportOpen(
                false,
              )
            }
            className="absolute inset-0"
          />

          <form
            onSubmit={
              submitReport
            }
            className="relative z-10 max-h-[calc(100vh-40px)] w-full max-w-[680px] overflow-y-auto rounded-[28px] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5 text-[var(--portal-text)] shadow-[0_35px_120px_rgba(0,0,0,0.35)] sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--portal-green-soft)] px-3 py-2 text-[6px] font-black uppercase tracking-[0.16em] text-[var(--portal-green)]">
                  <span className="h-3.5 w-3.5">
                    <TargetIcon />
                  </span>

                  New opportunity
                </span>

                <h2 className="mt-4 text-[25px] font-black tracking-[-0.05em]">
                  Report a prospect.
                </h2>

                <p className="mt-2 max-w-[480px] text-[7.5px] leading-5 text-[var(--portal-muted)]">
                  Share accurate information about the prospect so the opportunity can be reviewed and correctly attributed to you.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  reportSaving
                }
                onClick={() =>
                  setReportOpen(
                    false,
                  )
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-2)] text-[var(--portal-muted)]"
              >
                <span className="h-4 w-4">
                  <CloseIcon />
                </span>
              </button>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-2 block text-[6.5px] font-extrabold text-[var(--portal-muted)]">
                  Category *
                </span>

                <select
                  value={
                    reportForm.category
                  }
                  onChange={(
                    event,
                  ) =>
                    setReportForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        category:
                          event.target
                            .value as
                            RepresentativeReportCategory,
                      }),
                    )
                  }
                  className="h-12 w-full rounded-[14px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-3 text-[8.5px] text-[var(--portal-text)] outline-none transition focus:border-[var(--portal-green)]"
                >
                  <option value="lead">
                    New Lead
                  </option>

                  <option value="follow_up">
                    Follow Up
                  </option>

                  <option value="meeting">
                    Meeting
                  </option>

                  <option value="issue">
                    Issue
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </label>

              <label>
                <span className="mb-2 block text-[6.5px] font-extrabold text-[var(--portal-muted)]">
                  Report Title *
                </span>

                <input
                  value={
                    reportForm.title
                  }
                  onChange={(
                    event,
                  ) =>
                    setReportForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        title:
                          event.target.value,
                      }),
                    )
                  }
                  placeholder="Interested restaurant owner"
                  className="h-12 w-full rounded-[14px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-3 text-[8.5px] text-[var(--portal-text)] outline-none placeholder:text-[var(--portal-faint)] focus:border-[var(--portal-green)]"
                />
              </label>

              <label>
                <span className="mb-2 block text-[6.5px] font-extrabold text-[var(--portal-muted)]">
                  Business / Organization *
                </span>

                <input
                  value={
                    reportForm.businessName
                  }
                  onChange={(
                    event,
                  ) =>
                    setReportForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        businessName:
                          event.target.value,
                      }),
                    )
                  }
                  placeholder="Business name"
                  className="h-12 w-full rounded-[14px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-3 text-[8.5px] text-[var(--portal-text)] outline-none placeholder:text-[var(--portal-faint)] focus:border-[var(--portal-green)]"
                />
              </label>

              <label>
                <span className="mb-2 block text-[6.5px] font-extrabold text-[var(--portal-muted)]">
                  Contact Person
                </span>

                <input
                  value={
                    reportForm.contactName
                  }
                  onChange={(
                    event,
                  ) =>
                    setReportForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        contactName:
                          event.target.value,
                      }),
                    )
                  }
                  placeholder="Contact name"
                  className="h-12 w-full rounded-[14px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-3 text-[8.5px] text-[var(--portal-text)] outline-none placeholder:text-[var(--portal-faint)] focus:border-[var(--portal-green)]"
                />
              </label>

              <label>
                <span className="mb-2 block text-[6.5px] font-extrabold text-[var(--portal-muted)]">
                  Client Phone
                </span>

                <input
                  value={
                    reportForm.clientPhone
                  }
                  onChange={(
                    event,
                  ) =>
                    setReportForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        clientPhone:
                          event.target.value,
                      }),
                    )
                  }
                  placeholder="+251..."
                  className="h-12 w-full rounded-[14px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-3 text-[8.5px] text-[var(--portal-text)] outline-none placeholder:text-[var(--portal-faint)] focus:border-[var(--portal-green)]"
                />
              </label>

              <label>
                <span className="mb-2 block text-[6.5px] font-extrabold text-[var(--portal-muted)]">
                  Client Email
                </span>

                <input
                  type="email"
                  value={
                    reportForm.clientEmail
                  }
                  onChange={(
                    event,
                  ) =>
                    setReportForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        clientEmail:
                          event.target.value,
                      }),
                    )
                  }
                  placeholder="client@example.com"
                  className="h-12 w-full rounded-[14px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-3 text-[8.5px] text-[var(--portal-text)] outline-none placeholder:text-[var(--portal-faint)] focus:border-[var(--portal-green)]"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="mb-2 block text-[6.5px] font-extrabold text-[var(--portal-muted)]">
                  Estimated Budget (ETB)
                </span>

                <input
                  type="number"
                  min="0"
                  value={
                    reportForm.estimatedBudget
                  }
                  onChange={(
                    event,
                  ) =>
                    setReportForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        estimatedBudget:
                          event.target.value,
                      }),
                    )
                  }
                  placeholder="50000"
                  className="h-12 w-full rounded-[14px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-3 text-[8.5px] text-[var(--portal-text)] outline-none placeholder:text-[var(--portal-faint)] focus:border-[var(--portal-green)]"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="mb-2 block text-[6.5px] font-extrabold text-[var(--portal-muted)]">
                  Details *
                </span>

                <textarea
                  rows={
                    6
                  }
                  maxLength={
                    5000
                  }
                  value={
                    reportForm.details
                  }
                  onChange={(
                    event,
                  ) =>
                    setReportForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        details:
                          event.target.value,
                      }),
                    )
                  }
                  placeholder="Explain what the customer needs, how interested they are, what you discussed and anything important Baki should know..."
                  className="w-full resize-y rounded-[14px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-3 py-3 text-[8.5px] leading-5 text-[var(--portal-text)] outline-none placeholder:text-[var(--portal-faint)] focus:border-[var(--portal-green)]"
                />
              </label>
            </div>

            {error && (
              <div className="mt-4 rounded-[14px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-[7.5px] text-red-400">
                {
                  error
                }
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={
                  reportSaving
                }
                onClick={() =>
                  setReportOpen(
                    false,
                  )
                }
                className="h-11 rounded-[13px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-5 text-[7.5px] font-extrabold text-[var(--portal-muted)]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  reportSaving
                }
                className="flex h-11 items-center justify-center gap-2 rounded-[13px] bg-[var(--portal-green)] px-6 text-[7.5px] font-extrabold text-white shadow-[0_10px_25px_rgba(66,108,43,0.20)] disabled:opacity-60"
              >
                {reportSaving
                  ? "Submitting..."
                  : "Submit Report"}

                {!reportSaving && (
                  <span className="h-3.5 w-3.5">
                    <ArrowRightIcon />
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}