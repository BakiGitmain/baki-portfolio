"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  getCurrentAdmin,
  logoutAdmin,
  type AdminUser,
} from "@/lib/admin-api";

import {
  useLanguage,
} from "@/components/providers/language-provider";

import {
  ADMIN_REPORTS_CHANGED_EVENT,
  getAdminUnreadReportCount,
} from "@/lib/admin-reports-api";

import {
  getAdminProgramAttentionCount,
} from "@/lib/admin-programs-api";

import {
  getAdminChatReportAttentionCount,
} from "@/lib/admin-chat-reports-api";

import {
  usePartnerChatUnread,
} from "@/components/chat/use-partner-chat-unread";

import {
  disconnectPartnerChat,
  getPartnerChatConnection,
} from "@/lib/partner-chat-socket";

/* =========================================================
   TYPES
   ========================================================= */

type AdminShellProps = {
  children:
    | ReactNode
    | ((admin: AdminUser) => ReactNode);
};

type AdminPageKey =
  | "dashboard"
  | "projects"
  | "sites"
  | "applications"
  | "reports"
  | "chat"
  | "chatReports"
  | "programs"
  | "training"
  | "settings";

/* =========================================================
   ICONS
   ========================================================= */

function DashboardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
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
    </svg>
  );
}

function ProjectsIcon() {
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
        height="16"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M7 15L10 12L13 15L16 10L20 14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx="8"
        cy="8"
        r="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function SitesIcon() {
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
        d="M3.8 12H20.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M12 3.5C14.2 5.8 15.4 8.7 15.4 12C15.4 15.3 14.2 18.2 12 20.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M12 3.5C9.8 5.8 8.6 8.7 8.6 12C8.6 15.3 9.8 18.2 12 20.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ApplicationsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="5"
        width="16"
        height="16"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M9 3H15V7H9V3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M8 12H16M8 16H13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReportsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 4H19V17H9L5 21V4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M9 9H15M9 13H13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 5.5C4 4.7 4.7 4 5.5 4H18.5C19.3 4 20 4.7 20 5.5V15.5C20 16.3 19.3 17 18.5 17H10L5 21V17H5.5C4.7 17 4 16.3 4 15.5V5.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M8 9H16M8 13H13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProgramsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6C4 4.9 4.9 4 6 4H18C19.1 4 20 4.9 20 6V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V6Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 9H16M8 13H13M8 17H11"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrainingIcon() {
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
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M10 8L16 11L10 14V8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      <path
        d="M8 21H16M12 18V21"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M19.4 15A1.7 1.7 0 0 0 19.7 16.9L19.8 17C20.5 17.7 20.5 18.8 19.8 19.5C19.1 20.2 18 20.2 17.3 19.5L17.2 19.4A1.7 1.7 0 0 0 15.3 19.1A1.7 1.7 0 0 0 14.3 20.7V21C14.3 22 13.5 22.8 12.5 22.8H11.5C10.5 22.8 9.7 22 9.7 21V20.8A1.7 1.7 0 0 0 8.6 19.2A1.7 1.7 0 0 0 6.7 19.5L6.6 19.6C5.9 20.3 4.8 20.3 4.1 19.6C3.4 18.9 3.4 17.8 4.1 17.1L4.2 17A1.7 1.7 0 0 0 4.5 15.1A1.7 1.7 0 0 0 2.9 14.1H2.7C1.7 14.1 1 13.3 1 12.3V11.3C1 10.3 1.8 9.5 2.8 9.5H3A1.7 1.7 0 0 0 4.6 8.4A1.7 1.7 0 0 0 4.3 6.5L4.2 6.4C3.5 5.7 3.5 4.6 4.2 3.9C4.9 3.2 6 3.2 6.7 3.9L6.8 4A1.7 1.7 0 0 0 8.7 4.3H8.8A1.7 1.7 0 0 0 9.8 2.7V2.5C9.8 1.5 10.6 0.7 11.6 0.7H12.6C13.6 0.7 14.4 1.5 14.4 2.5V2.7A1.7 1.7 0 0 0 15.5 4.3A1.7 1.7 0 0 0 17.4 4L17.5 3.9C18.2 3.2 19.3 3.2 20 3.9C20.7 4.6 20.7 5.7 20 6.4L19.9 6.5A1.7 1.7 0 0 0 19.6 8.4V8.5A1.7 1.7 0 0 0 21.2 9.5H21.4C22.4 9.5 23.2 10.3 23.2 11.3V12.3C23.2 13.3 22.4 14.1 21.4 14.1H21.2A1.7 1.7 0 0 0 19.6 15.2L19.4 15Z"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7H20M4 12H20M4 17H20"
        stroke="currentColor"
        strokeWidth="1.8"
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

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 9L12 14L17 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 11L12 4L21 11"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M5 10V20H19V10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 5H6C4.9 5 4 5.9 4 7V17C4 18.1 4.9 19 6 19H10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M14 8L18 12L14 16M8 12H18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function AdminShell({
  children,
}: AdminShellProps) {
  const router =
    useRouter();

  const pathname =
    usePathname();

  const {
    language,
    setLanguage,
  } = useLanguage();

  const [
    admin,
    setAdmin,
  ] =
    useState<AdminUser | null>(
      null,
    );

  const unreadChatCount =
    usePartnerChatUnread({
      role:
        "admin",
      language,
      enabled:
        Boolean(
          admin,
        ),
    });

  const [
    loading,
    setLoading,
  ] = useState(true);
const [
  authUnavailable,
  setAuthUnavailable,
] = useState(false);

const [
  authRetryKey,
  setAuthRetryKey,
] = useState(0);
  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  const [
    accountOpen,
    setAccountOpen,
  ] = useState(false);

  const [
    unreadReportCount,
    setUnreadReportCount,
  ] = useState(0);

  const [
    programAttentionCount,
    setProgramAttentionCount,
  ] = useState(0);

  const [
    chatReportAttentionCount,
    setChatReportAttentionCount,
  ] = useState(0);

  const accountRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  /* =======================================================
     COPY
     ======================================================= */

  const copy =
    language === "am"
      ? {
          admin:
            "ADMIN CONTROL",

          dashboard:
            "ዳሽቦርድ",

          projects:
            "ፕሮጀክቶች",

          sites:
            "ድረ-ገጾች",

          applications:
            "ማመልከቻዎች",

          reports:
            "ሪፖርቶች",

          chatReports:
            "የChat ሪፖርቶች",

          programs:
            "ፕሮግራሞች",

          training:
            "ስልጠና",

          settings:
            "ቅንብሮች",

          main:
            "ዋና",

          management:
            "አስተዳደር",

          viewPortfolio:
            "Portfolio ይመልከቱ",

          logout:
            "ውጣ",

          adminRole:
            "Administrator",

          loading:
            "Admin በመጫን ላይ...",

          closeSidebar:
            "Sidebar ዝጋ",

          openSidebar:
            "Sidebar ክፈት",

          pages: {
            dashboard: {
              title:
                "ዳሽቦርድ",

              description:
                "Projects፣ applications፣ programs እና training ከአንድ ቦታ ያስተዳድሩ።",
            },

            projects: {
              title:
                "ፕሮጀክቶች",

              description:
                "Portfolio projectsን create፣ edit፣ publish እና manage ያድርጉ።",
            },

            sites: {
              title:
                "ድረ-ገጾች",

              description:
                "የሰራኸውን websites፣ analytics፣ performance እና health ከአንድ ቦታ ተከታተል።",
            },

            applications: {
              title:
                "ማመልከቻዎች",

              description:
                "የSales Representative applicationsን ይመልከቱ እና ያስተዳድሩ።",
            },

            reports: {
              title:
                "ሪፖርቶች",

              description:
                "የSales Partner የሥራ ሪፖርቶችን ያንብቡ እና ምላሽ ይላኩ።",
            },

            chatReports: {
              title:
                "የChat ሪፖርቶች",

              description:
                "Partners ሪፖርት ያደረጓቸውን መልዕክቶች ይገምግሙ እና የመለያ እርምጃ ይውሰዱ።",
            },

            programs: {
              title:
                "ፕሮግራሞች",

              description:
                "Sales programs፣ commission structures እና opportunities ያስተዳድሩ።",
            },

            training: {
              title:
                "ስልጠና",

              description:
                "Accepted representatives የሚጠቀሙባቸውን training resources ያስተዳድሩ።",
            },

            settings: {
              title:
                "ቅንብሮች",

              description:
                "Admin account እና security settingsዎን ያስተዳድሩ።",
            },
          },
        }
      : {
          admin:
            "ADMIN CONTROL",

          dashboard:
            "Dashboard",

          projects:
            "Projects",

          sites:
            "Sites",

          applications:
            "Applications",

          reports:
            "Reports",

          chatReports:
            "Chat Reports",

          programs:
            "Programs",

          training:
            "Training",

          settings:
            "Settings",

          main:
            "MAIN",

          management:
            "MANAGEMENT",

          viewPortfolio:
            "View Portfolio",

          logout:
            "Logout",

          adminRole:
            "Administrator",

          loading:
            "Loading admin...",

          closeSidebar:
            "Close sidebar",

          openSidebar:
            "Open sidebar",

          pages: {
            dashboard: {
              title:
                "Dashboard",

              description:
                "Manage projects, applications, programs and training from one place.",
            },

            projects: {
              title:
                "Projects",

              description:
                "Create, edit, publish and manage your portfolio projects.",
            },

            sites: {
              title:
                "Sites",

              description:
                "Manage and monitor your deployed websites, analytics, performance and health.",
            },

            applications: {
              title:
                "Applications",

              description:
                "Review and manage sales representative applications.",
            },

            reports: {
              title:
                "Reports",

              description:
                "Read Sales Partner work reports and send replies.",
            },

            chatReports: {
              title:
                "Chat Reports",

              description:
                "Review reported Partner Chat messages and take documented account action.",
            },

            programs: {
              title:
                "Programs",

              description:
                "Manage sales programs, commission structures and opportunities.",
            },

            training: {
              title:
                "Training",

              description:
                "Manage resources used by accepted sales representatives.",
            },

            settings: {
              title:
                "Settings",

              description:
                "Manage your administrator account and security settings.",
            },
          },
        };

  /* =======================================================
     NAVIGATION
     ======================================================= */

  const navigation = [
    {
      label:
        copy.dashboard,

      href:
        "/admin/dashboard",

      icon:
        <DashboardIcon />,
    },

    {
      label:
        copy.projects,

      href:
        "/admin/projects",

      icon:
        <ProjectsIcon />,
    },

    {
      label:
        copy.sites,

      href:
        "/admin/sites",

      icon:
        <SitesIcon />,
    },

    {
      label:
        copy.applications,

      href:
        "/admin/applications",

      icon:
        <ApplicationsIcon />,
    },

    {
      label:
        copy.reports,

      href:
        "/admin/reports",

      icon:
        <ReportsIcon />,
    },

    {
      label:
        language ===
          "am"
          ? "ውይይት"
          : "Chat",

      href:
        "/admin/chat",

      icon:
        <ChatIcon />,
    },

    {
      label:
        copy.chatReports,

      href:
        "/admin/chat-reports",

      icon:
        <ReportsIcon />,
    },

    {
      label:
        copy.programs,

      href:
        "/admin/programs",

      icon:
        <ProgramsIcon />,
    },

    {
      label:
        copy.training,

      href:
        "/admin/training",

      icon:
        <TrainingIcon />,
    },
  ];

  /* =======================================================
     CURRENT PAGE
     ======================================================= */

  let pageKey:
    AdminPageKey =
      "dashboard";

  if (
    pathname.startsWith(
      "/admin/projects",
    )
  ) {
    pageKey =
      "projects";
  } else if (
    pathname.startsWith(
      "/admin/sites",
    )
  ) {
    pageKey =
      "sites";
  } else if (
    pathname.startsWith(
      "/admin/applications",
    )
  ) {
    pageKey =
      "applications";
  } else if (
    pathname.startsWith(
      "/admin/reports",
    )
  ) {
    pageKey =
      "reports";
  } else if (
    pathname.startsWith(
      "/admin/chat-reports",
    )
  ) {
    pageKey =
      "chatReports";
  } else if (
    pathname.startsWith(
      "/admin/chat",
    )
  ) {
    pageKey =
      "chat";
  } else if (
    pathname.startsWith(
      "/admin/programs",
    )
  ) {
    pageKey =
      "programs";
  } else if (
    pathname.startsWith(
      "/admin/training",
    )
  ) {
    pageKey =
      "training";
  } else if (
    pathname.startsWith(
      "/admin/settings",
    )
  ) {
    pageKey =
      "settings";
  }

  const page =
    pageKey ===
    "chat"
      ? language ===
          "am"
        ? {
            title:
              "የአጋሮች ውይይት",
            description:
              "ከBaki Digital አጋሮች ጋር በቀጥታ ይወያዩ እና መልዕክቶችን ያስተዳድሩ።",
          }
        : {
            title:
              "Partner Chat",
            description:
              "Talk with Baki Digital partners in real time and moderate messages.",
          }
      : copy.pages[
          pageKey
        ];

  /* =======================================================
     AUTH
     ======================================================= */

 useEffect(() => {
  let cancelled =
    false;

  async function loadAdmin() {
    setLoading(
      true,
    );

    setAuthUnavailable(
      false,
    );

    try {
      const currentAdmin =
        await getCurrentAdmin();

      if (
        cancelled
      ) {
        return;
      }

      /* ===================================================
         REAL UNAUTHENTICATED SESSION
         =================================================== */

      if (
        !currentAdmin
      ) {
        router.replace(
          "/admin/login",
        );

        return;
      }

      /* ===================================================
         VALID ADMIN
         =================================================== */

      setAdmin(
        currentAdmin,
      );

      setLoading(
        false,
      );
    } catch (
      error
    ) {
      /*
        Backend/network failure is NOT logout.

        Keep the user on the admin area and allow retry.
      */

      console.error(
        "Unable to verify admin session:",
        error,
      );

      if (
        cancelled
      ) {
        return;
      }

      setAuthUnavailable(
        true,
      );

      setLoading(
        false,
      );
    }
  }

  void loadAdmin();

  return () => {
    cancelled =
      true;
  };
}, [
  router,
  authRetryKey,
]);

  useEffect(() => {
    if (
      !admin
    ) {
      return;
    }

    let cancelled =
      false;

    async function refreshUnreadReports() {
      try {
        const count =
          await getAdminUnreadReportCount(
            language,
          );

        if (
          !cancelled
        ) {
          setUnreadReportCount(
            count,
          );
        }
      } catch (
        error
      ) {
        console.error(
          "Unable to load the unread report count:",
          error,
        );
      }
    }

    const handleReportsChanged =
      () => {
        void refreshUnreadReports();
      };

    void refreshUnreadReports();

    const intervalId =
      window.setInterval(
        refreshUnreadReports,
        60_000,
      );

    window.addEventListener(
      ADMIN_REPORTS_CHANGED_EVENT,
      handleReportsChanged,
    );

    let cleanupSocket:
      (() => void) |
      null =
      null;

    void getPartnerChatConnection(
      "admin",
      language,
    )
      .then(
        (
          connection,
        ) => {
          if (
            cancelled
          ) {
            return;
          }

          const handleRealtimeReport =
            () => {
              window.dispatchEvent(
                new Event(
                  ADMIN_REPORTS_CHANGED_EVENT,
                ),
              );
            };

          connection.socket.on(
            "admin:reports:changed",
            handleRealtimeReport,
          );

          cleanupSocket =
            () => {
              connection.socket.off(
                "admin:reports:changed",
                handleRealtimeReport,
              );
            };
        },
      )
      .catch(
        (
          error,
        ) => {
          console.error(
            "Unable to connect report notifications:",
            error instanceof
              Error
              ? error.message
              : "Unknown realtime notification error.",
          );
        },
      );

    return () => {
      cancelled =
        true;

      window.clearInterval(
        intervalId,
      );

      window.removeEventListener(
        ADMIN_REPORTS_CHANGED_EVENT,
        handleReportsChanged,
      );

      cleanupSocket?.();
    };
  }, [
    admin,
    language,
  ]);

  useEffect(() => {
    if (!admin) return;
    let cancelled = false;

    async function refreshProgramAttention() {
      try {
        const count = await getAdminProgramAttentionCount();
        if (!cancelled) setProgramAttentionCount(count);
      } catch (error) {
        console.error(
          "Unable to load Program attention count:",
          error instanceof Error ? error.message : "Unknown Program attention error.",
        );
      }
    }

    void refreshProgramAttention();
    const intervalId = window.setInterval(refreshProgramAttention, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [admin, pathname]);

  useEffect(() => {
    if (!admin) return;

    let cancelled = false;
    let cleanupSocket: (() => void) | null = null;

    async function refreshChatReportAttention() {
      try {
        const count = await getAdminChatReportAttentionCount(language);
        if (!cancelled) setChatReportAttentionCount(count);
      } catch (error) {
        console.error(
          "Unable to load Chat report attention count:",
          error instanceof Error ? error.message : "Unknown Chat report error.",
        );
      }
    }

    void refreshChatReportAttention();
    const intervalId = window.setInterval(refreshChatReportAttention, 60_000);

    void getPartnerChatConnection("admin", language)
      .then((connection) => {
        if (cancelled) return;

        const handleChanged = () => {
          void refreshChatReportAttention();
        };

        connection.socket.on("admin:chat-reports:changed", handleChanged);
        cleanupSocket = () => {
          connection.socket.off("admin:chat-reports:changed", handleChanged);
        };
      })
      .catch((error) => {
        console.error(
          "Unable to connect Chat report notifications:",
          error instanceof Error ? error.message : "Unknown realtime notification error.",
        );
      });

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      cleanupSocket?.();
    };
  }, [admin, language, pathname]);

  /* =======================================================
     ACCOUNT DROPDOWN OUTSIDE CLICK
     ======================================================= */

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent,
    ) {
      if (
        accountRef.current &&
        !accountRef.current.contains(
          event.target as Node,
        )
      ) {
        setAccountOpen(
          false,
        );
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  /* =======================================================
     NAVIGATION HANDLER
     ======================================================= */

  function closeNavigation() {
    setSidebarOpen(
      false,
    );

    setAccountOpen(
      false,
    );
  }

  /* =======================================================
     LOGOUT
     ======================================================= */

  async function handleLogout() {
    setAccountOpen(
      false,
    );

    setSidebarOpen(
      false,
    );

    try {
      await logoutAdmin();
    } finally {
      disconnectPartnerChat(
        "admin",
      );

      router.replace(
        "/admin/login",
      );

      router.refresh();
    }
  }

  /* =======================================================
     LOADING
     ======================================================= */

  if (
    loading ||
    !admin
  ) {
    /* =========================================================
   AUTH SERVICE TEMPORARILY UNAVAILABLE

   Do NOT redirect to login.

   The session may still be completely valid.
   ========================================================= */

if (
  authUnavailable &&
  !admin
) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f3] px-5">
      <div className="w-full max-w-[390px] rounded-[24px] border border-black/[0.06] bg-white p-7 text-center shadow-[0_20px_60px_rgba(38,52,29,0.07)]">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef6e7] text-lg">
          ⚠️
        </div>

        <h1 className="mt-5 text-[18px] font-black tracking-[-0.04em] text-[#171b15]">
          {language ===
          "am"
            ? "Sessionን ማረጋገጥ አልተቻለም"
            : "Unable to verify session"}
        </h1>

        <p className="mt-2 text-[10px] leading-5 text-black/45">
          {language ===
          "am"
            ? "Sessionዎ አልጠፋም። Backendን ለጊዜው ማግኘት አልተቻለም።"
            : "Your session hasn't been treated as logged out. The server may just be temporarily unavailable."}
        </p>

        <button
          type="button"
          onClick={() => {
            setAuthRetryKey(
              (
                current,
              ) =>
                current +
                1,
            );
          }}
          className="mt-5 h-10 rounded-xl bg-[#426c2b] px-6 text-[10px] font-bold text-white transition hover:bg-[#355923]"
        >
          {language ===
          "am"
            ? "እንደገና ሞክር"
            : "Try Again"}
        </button>
      </div>
    </main>
  );
}
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f3]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-t-[#426c2b]" />

          <span className="text-[10px] font-medium text-black/35">
            {copy.loading}
          </span>
        </div>
      </main>
    );
  }

  /* =======================================================
     INITIALS
     ======================================================= */

  const initials =
    admin.name
      .split(" ")
      .filter(
        Boolean,
      )
      .slice(
        0,
        2,
      )
      .map(
        (part) =>
          part[0]?.toUpperCase(),
      )
      .join("");

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="min-h-screen bg-[#f7f8f3] lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* =================================================
          MOBILE OVERLAY
         ================================================= */}

      {sidebarOpen && (
        <button
          type="button"
          aria-label={
            copy.closeSidebar
          }
          onClick={() =>
            setSidebarOpen(
              false,
            )
          }
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* =================================================
          SIDEBAR
         ================================================= */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-black/[0.06] bg-[#fbfcf8] shadow-[18px_0_55px_rgba(31,42,24,0.05)] transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* BRAND */}

        <div className="flex h-[82px] shrink-0 items-center justify-between border-b border-black/[0.055] px-5">
          <Link
            href="/admin/dashboard"
            onClick={
              closeNavigation
            }
            className="flex items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#426c2b] text-[12px] font-black text-white shadow-[0_8px_20px_rgba(66,108,43,0.18)]">
              &lt;/&gt;
            </span>

            <div>
              <strong className="block text-[14px] font-black tracking-[-0.04em] text-[#171b15]">
                BAKI
              </strong>

              <span className="text-[7px] font-extrabold tracking-[0.17em] text-[#72934f]">
                {
                  copy.admin
                }
              </span>
            </div>
          </Link>

          <button
            type="button"
            aria-label={
              copy.closeSidebar
            }
            onClick={() =>
              setSidebarOpen(
                false,
              )
            }
            className="flex h-9 w-9 items-center justify-center rounded-xl text-black/40 transition hover:bg-black/[0.04] lg:hidden"
          >
            <span className="h-5 w-5">
              <CloseIcon />
            </span>
          </button>
        </div>

        {/* =================================================
            NAVIGATION
           ================================================= */}

        <div className="flex-1 overflow-y-auto px-3 py-6">
          <span className="mb-2 block px-3 text-[7px] font-extrabold tracking-[0.18em] text-black/25">
            {
              copy.main
            }
          </span>

          <nav className="space-y-1">
            {navigation.map(
              (item) => {
                const active =
                  pathname ===
                    item.href ||
                  pathname.startsWith(
                    `${item.href}/`,
                  );

                const itemUnreadCount =
                  item.href === "/admin/chat"
                    ? unreadChatCount
                    : item.href === "/admin/chat-reports"
                      ? chatReportAttentionCount
                    : item.href === "/admin/reports"
                      ? unreadReportCount
                      : item.href === "/admin/programs"
                        ? programAttentionCount
                        : 0;

                return (
                  <Link
                    key={
                      item.href
                    }
                    href={
                      item.href
                    }
                    onClick={
                      closeNavigation
                    }
                    className={`group relative flex h-11 items-center gap-3 rounded-xl px-3 text-[10.5px] font-semibold transition-all duration-200 ${
                      active
                        ? "bg-[#edf5e7] text-[#426c2b]"
                        : "text-black/45 hover:bg-black/[0.035] hover:text-black/70"
                    }`}
                  >
                    <span
                      className={`h-[18px] w-[18px] shrink-0 ${
                        active
                          ? "text-[#5f8f3f]"
                          : "text-black/32 group-hover:text-black/50"
                      }`}
                    >
                      {
                        item.icon
                      }
                    </span>

                    <span className="min-w-0 flex-1 truncate">
                      {
                        item.label
                      }
                    </span>

                    {itemUnreadCount > 0 ? (
                      <span
                        role="status"
                        aria-label={`${itemUnreadCount} ${item.label.toLowerCase()} items need attention`}
                        className="flex min-w-5 shrink-0 items-center justify-center rounded-full bg-[#c74f3d] px-1.5 py-0.5 text-[9px] font-extrabold leading-none text-white shadow-[0_4px_10px_rgba(199,79,61,0.24)]"
                      >
                        {itemUnreadCount > 99
                          ? "99+"
                          : itemUnreadCount}
                      </span>
                    ) : active ? (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#80c93c] shadow-[0_0_8px_rgba(128,201,60,0.45)]" />
                    ) : null}
                  </Link>
                );
              },
            )}
          </nav>

          {/* =================================================
              MANAGEMENT
             ================================================= */}

          <div className="my-5 h-px bg-black/[0.055]" />

          <span className="mb-2 block px-3 text-[7px] font-extrabold tracking-[0.18em] text-black/25">
            {
              copy.management
            }
          </span>

          <Link
            href="/admin/settings"
            onClick={
              closeNavigation
            }
            className={`group flex h-11 items-center gap-3 rounded-xl px-3 text-[10.5px] font-semibold transition-all duration-200 ${
              pathname.startsWith(
                "/admin/settings",
              )
                ? "bg-[#edf5e7] text-[#426c2b]"
                : "text-black/45 hover:bg-black/[0.035] hover:text-black/70"
            }`}
          >
            <span
              className={`h-[18px] w-[18px] ${
                pathname.startsWith(
                  "/admin/settings",
                )
                  ? "text-[#5f8f3f]"
                  : "text-black/32 group-hover:text-black/50"
              }`}
            >
              <SettingsIcon />
            </span>

            <span className="flex-1">
              {
                copy.settings
              }
            </span>

            {pathname.startsWith(
              "/admin/settings",
            ) && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#80c93c] shadow-[0_0_8px_rgba(128,201,60,0.45)]" />
            )}
          </Link>
        </div>

        {/* =================================================
            SIDEBAR ACCOUNT
           ================================================= */}

        <div className="shrink-0 border-t border-black/[0.055] p-3">
          <div className="flex items-center gap-3 rounded-xl border border-black/[0.035] bg-[#f5f7f1] p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[9px] font-black text-[#426c2b] shadow-sm">
              {initials ||
                "BA"}
            </span>

            <div className="min-w-0">
              <strong className="block truncate text-[9.5px] font-bold text-[#22271f]">
                {
                  admin.name
                }
              </strong>

              <span className="block truncate text-[8px] text-black/35">
                @
                {
                  admin.username
                }
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* =================================================
          MAIN AREA
         ================================================= */}

      <div className="min-w-0">
        {/* =================================================
            TOPBAR
           ================================================= */}

        <header className="sticky top-0 z-30 flex h-[82px] items-center justify-between border-b border-black/[0.055] bg-[#f7f8f3]/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          {/* LEFT */}

          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              aria-label={
                copy.openSidebar
              }
              onClick={() =>
                setSidebarOpen(
                  true,
                )
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/[0.06] bg-white text-black/50 shadow-sm transition hover:border-[#739f52]/20 hover:text-[#426c2b] lg:hidden"
            >
              <span className="h-5 w-5">
                <MenuIcon />
              </span>
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-[18px] font-extrabold tracking-[-0.04em] text-[#171b15] sm:text-[21px]">
                {
                  page.title
                }
              </h1>

              <p className="mt-0.5 hidden max-w-[560px] truncate text-[8.5px] text-black/35 sm:block">
                {
                  page.description
                }
              </p>
            </div>
          </div>

          {/* =================================================
              RIGHT
             ================================================= */}

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* LANGUAGE */}

            <div className="hidden items-center rounded-xl border border-black/[0.06] bg-white p-1 shadow-sm sm:flex">
              <button
                type="button"
                onClick={() =>
                  setLanguage(
                    "en",
                  )
                }
                className={`rounded-lg px-2.5 py-1.5 text-[7.5px] font-extrabold transition ${
                  language ===
                  "en"
                    ? "bg-[#edf5e7] text-[#426c2b]"
                    : "text-black/30 hover:text-black/50"
                }`}
              >
                EN
              </button>

              <button
                type="button"
                onClick={() =>
                  setLanguage(
                    "am",
                  )
                }
                className={`rounded-lg px-2.5 py-1.5 text-[7.5px] font-extrabold transition ${
                  language ===
                  "am"
                    ? "bg-[#edf5e7] text-[#426c2b]"
                    : "text-black/30 hover:text-black/50"
                }`}
              >
                AM
              </button>
            </div>

            {/* =================================================
                ACCOUNT
               ================================================= */}

            <div
              ref={
                accountRef
              }
              className="relative"
            >
              <button
                type="button"
                aria-expanded={
                  accountOpen
                }
                aria-haspopup="menu"
                onClick={() =>
                  setAccountOpen(
                    (current) =>
                      !current,
                  )
                }
                className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white p-1.5 pr-2.5 shadow-sm transition hover:border-[#719e50]/20 hover:shadow-[0_8px_24px_rgba(36,48,28,0.055)]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf5e7] text-[8px] font-black text-[#426c2b]">
                  {initials ||
                    "BA"}
                </span>

                <div className="hidden max-w-[120px] text-left sm:block">
                  <strong className="block truncate text-[8.5px] font-bold text-[#242820]">
                    {
                      admin.name
                    }
                  </strong>

                  <span className="block text-[7px] text-black/30">
                    {
                      copy.adminRole
                    }
                  </span>
                </div>

                <span
                  className={`h-4 w-4 text-black/30 transition-transform duration-200 ${
                    accountOpen
                      ? "rotate-180"
                      : ""
                  }`}
                >
                  <ChevronIcon />
                </span>
              </button>

              {/* =================================================
                  DROPDOWN
                 ================================================= */}

              {accountOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+10px)] w-[235px] overflow-hidden rounded-2xl border border-black/[0.07] bg-white p-2 shadow-[0_18px_50px_rgba(34,46,27,0.13)]"
                >
                  <div className="border-b border-black/[0.055] px-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf5e7] text-[8px] font-black text-[#426c2b]">
                        {initials ||
                          "BA"}
                      </span>

                      <div className="min-w-0">
                        <strong className="block truncate text-[10px] font-bold text-[#20251d]">
                          {
                            admin.name
                          }
                        </strong>

                        <span className="mt-0.5 block truncate text-[8px] text-black/35">
                          {
                            admin.email
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    <Link
                      href="/admin/settings"
                      role="menuitem"
                      onClick={
                        closeNavigation
                      }
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[9px] font-semibold text-black/55 transition hover:bg-[#f4f7f0] hover:text-[#426c2b]"
                    >
                      <span className="h-4 w-4">
                        <SettingsIcon />
                      </span>

                      {
                        copy.settings
                      }
                    </Link>

                    <Link
                      href="/"
                      target="_blank"
                      rel="noreferrer"
                      role="menuitem"
                      onClick={() =>
                        setAccountOpen(
                          false,
                        )
                      }
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[9px] font-semibold text-black/55 transition hover:bg-[#f4f7f0] hover:text-[#426c2b]"
                    >
                      <span className="h-4 w-4">
                        <HomeIcon />
                      </span>

                      {
                        copy.viewPortfolio
                      }
                    </Link>

                    <div className="my-1 h-px bg-black/[0.05]" />

                    <button
                      type="button"
                      role="menuitem"
                      onClick={
                        handleLogout
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[9px] font-semibold text-red-500 transition hover:bg-red-50"
                    >
                      <span className="h-4 w-4">
                        <LogoutIcon />
                      </span>

                      {
                        copy.logout
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* =================================================
            PAGE CONTENT
           ================================================= */}

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1450px]">
            {typeof children ===
            "function"
              ? children(
                  admin,
                )
              : children}
          </div>
        </main>
      </div>
    </div>
  );
}
