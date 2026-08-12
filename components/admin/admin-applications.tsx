"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import AcceptRepresentativeButton from "@/components/admin/accept-representative-button";
import AdminShell from "@/components/admin/admin-shell";
import AdminPartnerInsight, {
  type AdminPartnerDetailTab,
} from "@/components/admin/admin-partner-insight";

import {
  useLanguage,
} from "@/components/providers/language-provider";

import {
  getAdminApplication,
  getAdminApplicationDocument,
  getAdminApplicationInsight,
  getAdminApplications,
  updateAdminApplication,
  type AdminApplication,
  type AdminApplicationInsight,
  type ApplicationDocumentSide,
  type ApplicationFilterStatus,
  type ApplicationStatus,
  type ApplicationsPagination,
  type ApplicationsSummary,
} from "@/lib/admin-applications-api";

/* =========================================================
   DEFAULTS
   ========================================================= */

const emptySummary: ApplicationsSummary = {
  total: 0,
  pending: 0,
  reviewing: 0,
  accepted: 0,
  rejected: 0,
  archived: 0,
};

const emptyPagination: ApplicationsPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
};

/* =========================================================
   ICONS
   ========================================================= */

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M16 16L20 20"
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

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M5 20C5.9 16.6 8.2 15 12 15C15.8 15 18.1 16.6 19 20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IdIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <circle
        cx="8.5"
        cy="11"
        r="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      <path
        d="M6 16C6.5 14.5 7.3 13.8 8.5 13.8C9.7 13.8 10.5 14.5 11 16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      <path
        d="M14 9H18M14 12H18M14 15H17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 12C5.1 8.6 8.1 7 12 7C15.9 7 18.9 8.6 21 12C18.9 15.4 15.9 17 12 17C8.1 17 5.1 15.4 3 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="12"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ChevronIcon({
  direction,
}: {
  direction: "left" | "right";
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={
          direction === "left"
            ? "M15 6L9 12L15 18"
            : "M9 6L15 12L9 18"
        }
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =========================================================
   HELPERS
   ========================================================= */

function statusClass(
  status: ApplicationStatus,
) {
  switch (status) {
    case "pending":
      return "border-[#e4b64f]/20 bg-[#fff8e8] text-[#9c721d]";

    case "reviewing":
      return "border-[#5f91db]/20 bg-[#edf4ff] text-[#426da9]";

    case "accepted":
      return "border-[#70a650]/20 bg-[#edf6e8] text-[#426c2b]";

    case "rejected":
      return "border-red-200 bg-red-50 text-red-500";

    case "archived":
      return "border-black/[0.06] bg-[#f2f3f0] text-black/40";
  }
}

function formatStatus(
  status: ApplicationStatus,
) {
  return (
    status
      .charAt(0)
      .toUpperCase() +
    status.slice(1)
  );
}

function formatDate(
  value: string | null,
  language: "en" | "am",
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    language === "am"
      ? "am-ET"
      : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(date);
}

/* =========================================================
   INFO ITEM
   ========================================================= */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value:
    | string
    | null
    | undefined;
}) {
  return (
    <div className="min-w-0 rounded-[14px] border border-black/[0.055] bg-[#fafbf8] px-4 py-3.5">
      <span className="block text-[7px] font-extrabold uppercase tracking-[0.12em] text-black/30">
        {label}
      </span>

      <strong className="mt-1.5 block break-words text-[9px] font-bold leading-5 text-[#252a22]">
        {value || "—"}
      </strong>
    </div>
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function AdminApplications() {
  const {
    language,
  } =
    useLanguage();

  const [
    applications,
    setApplications,
  ] =
    useState<
      AdminApplication[]
    >([]);

  const [
    summary,
    setSummary,
  ] =
    useState<ApplicationsSummary>(
      emptySummary,
    );

  const [
    pagination,
    setPagination,
  ] =
    useState<ApplicationsPagination>(
      emptyPagination,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const [
    searchInput,
    setSearchInput,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<ApplicationFilterStatus>(
      "all",
    );

  const [
    page,
    setPage,
  ] =
    useState(1);

  const [
    selected,
    setSelected,
  ] =
    useState<
      AdminApplication | null
    >(null);

  const [
    insight,
    setInsight,
  ] = useState<AdminApplicationInsight | null>(null);

  const [
    detailTab,
    setDetailTab,
  ] = useState<AdminPartnerDetailTab>("overview");

  const [
    drawerLoading,
    setDrawerLoading,
  ] =
    useState(false);

  const [
    statusDraft,
    setStatusDraft,
  ] =
    useState<ApplicationStatus>(
      "pending",
    );

  const [
    notes,
    setNotes,
  ] =
    useState("");

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    documentLoading,
    setDocumentLoading,
  ] =
    useState<
      ApplicationDocumentSide | null
    >(null);

  /* =======================================================
     COPY
     ======================================================= */

  const copy =
    language === "am"
      ? {
          eyebrow:
            "SALES PROGRAM",

          title:
            "ማመልከቻዎች",

          description:
            "የSales Representative ማመልከቻዎችን ይመልከቱ፣ ያስተዳድሩ፣ ይቀበሉ ወይም ውድቅ ያድርጉ።",

          total:
            "ጠቅላላ",

          pending:
            "በመጠባበቅ ላይ",

          reviewing:
            "በምርመራ ላይ",

          accepted:
            "ተቀባይነት ያገኘ",

          rejected:
            "ውድቅ የተደረገ",

          search:
            "ስም፣ email፣ phone ወይም application ID ፈልግ...",

          all:
            "ሁሉም Status",

          noApplications:
            "ምንም application አልተገኘም",

          noApplicationsDescription:
            "Search ወይም filter በመቀየር ይሞክሩ።",

          review:
            "ይመልከቱ",

          submitted:
            "የተላከበት",

          location:
            "አካባቢ",

          application:
            "APPLICATION",

          personal:
            "የግል መረጃ",

          contact:
            "የመገናኛ መረጃ",

          motivation:
            "የማመልከቻ ምክንያት",

          identity:
            "የማንነት ማረጋገጫ",

          adminReview:
            "የAdmin Review",

          fullName:
            "ሙሉ ስም",

          fatherName:
            "የአባት ስም",

          email:
            "Email",

          phone:
            "Phone",

          city:
            "ከተማ",

          address:
            "አድራሻ",

          telegram:
            "Telegram",

          whatsapp:
            "WhatsApp",

          idType:
            "የID አይነት",

          rules:
            "ደንቦችን ተቀብሏል",

          reviewed:
            "Review የተደረገበት",

          viewFront:
            "የID ፊትን አሳይ",

          viewBack:
            "የID ጀርባን አሳይ",

          notes:
            "የAdmin Notes",

          notesPlaceholder:
            "የግል admin notes...",

          status:
            "Application Status",

          save:
            "Review አስቀምጥ",

          saving:
            "በማስቀመጥ ላይ...",

          markReviewing:
            "Reviewing",

          accept:
            "ተቀበል",

          reject:
            "ውድቅ አድርግ",

          archived:
            "Archived",

          updated:
            "Application በተሳካ ሁኔታ ተቀይሯል።",

          documentError:
            "የመታወቂያ documentን መክፈት አልተቻለም።",

          yes:
            "አዎ",

          previous:
            "Previous",

          next:
            "Next",

          page:
            "Page",
        }
      : {
          eyebrow:
            "SALES PROGRAM",

          title:
            "Applications",

          description:
            "Review and manage incoming Sales Representative applications.",

          total:
            "Total",

          pending:
            "Pending",

          reviewing:
            "Reviewing",

          accepted:
            "Accepted",

          rejected:
            "Rejected",

          search:
            "Search name, email, phone or application ID...",

          all:
            "All Status",

          noApplications:
            "No applications found",

          noApplicationsDescription:
            "Try changing your search or status filter.",

          review:
            "Review",

          submitted:
            "Submitted",

          location:
            "Location",

          application:
            "APPLICATION",

          personal:
            "Personal Information",

          contact:
            "Contact Information",

          motivation:
            "Motivation",

          identity:
            "Identity Verification",

          adminReview:
            "Admin Review",

          fullName:
            "Full Name",

          fatherName:
            "Father's Name",

          email:
            "Email",

          phone:
            "Phone",

          city:
            "City",

          address:
            "Address",

          telegram:
            "Telegram",

          whatsapp:
            "WhatsApp",

          idType:
            "ID Type",

          rules:
            "Rules Accepted",

          reviewed:
            "Reviewed",

          viewFront:
            "View Front ID",

          viewBack:
            "View Back ID",

          notes:
            "Admin Notes",

          notesPlaceholder:
            "Private notes about this applicant...",

          status:
            "Application Status",

          save:
            "Save Review",

          saving:
            "Saving...",

          markReviewing:
            "Mark Reviewing",

          accept:
            "Accept",

          reject:
            "Reject",

          archived:
            "Archived",

          updated:
            "Application updated successfully.",

          documentError:
            "Unable to open the identification document.",

          yes:
            "Yes",

          previous:
            "Previous",

          next:
            "Next",

          page:
            "Page",
        };

  /* =======================================================
     DEBOUNCE SEARCH

     The state changes happen inside the timer callback,
     not synchronously inside the Effect itself.
     ======================================================= */

  useEffect(
    () => {
      const timer =
        window.setTimeout(
          () => {
            setSearch(
              searchInput.trim(),
            );

            setPage(1);
          },
          350,
        );

      return () => {
        window.clearTimeout(
          timer,
        );
      };
    },
    [
      searchInput,
    ],
  );

  /* =======================================================
     REQUEST APPLICATIONS

     IMPORTANT:
     This function ONLY starts the API request.

     There are no synchronous React state updates here.
     ======================================================= */

  const requestApplications =
    useCallback(
      () =>
        getAdminApplications({
          language,
          search,
          status:
            statusFilter,
          page,
          limit: 20,
        }),
      [
        language,
        search,
        statusFilter,
        page,
      ],
    );

  /* =======================================================
     REFRESH APPLICATIONS

     Used manually after an admin changes an application.

     Since this runs from user-triggered actions rather
     than directly from an Effect, loading/error state can
     safely be changed here.
     ======================================================= */

  const refreshApplications =
    useCallback(
      async () => {
        const result =
          await requestApplications();

        setApplications(
          result.applications,
        );

        setSummary(
          result.summary,
        );

        setPagination(
          result.pagination,
        );

        setError("");
      },
      [
        requestApplications,
      ],
    );

  /* =======================================================
     INITIAL LOAD + FILTER / SEARCH / PAGE RELOAD

     Do not put setLoading(true) or setError("") directly
     in this Effect.

     State is only updated asynchronously after the request
     settles.
     ======================================================= */

  useEffect(
    () => {
      let cancelled =
        false;

      void requestApplications()
        .then(
          (
            result,
          ) => {
            if (
              cancelled
            ) {
              return;
            }

            setApplications(
              result.applications,
            );

            setSummary(
              result.summary,
            );

            setPagination(
              result.pagination,
            );

            setError("");
          },
        )
        .catch(
          (
            loadError:
              unknown,
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
                : "Unable to load applications.",
            );
          },
        )
        .finally(
          () => {
            if (
              cancelled
            ) {
              return;
            }

            setLoading(false);
          },
        );

      return () => {
        cancelled =
          true;
      };
    },
    [
      requestApplications,
    ],
  );

  /* =======================================================
     STATS
     ======================================================= */

  const statCards =
    useMemo(
      () => [
        {
          key:
            "total",

          label:
            copy.total,

          value:
            summary.total,
        },

        {
          key:
            "pending",

          label:
            copy.pending,

          value:
            summary.pending,
        },

        {
          key:
            "reviewing",

          label:
            copy.reviewing,

          value:
            summary.reviewing,
        },

        {
          key:
            "accepted",

          label:
            copy.accepted,

          value:
            summary.accepted,
        },

        {
          key:
            "rejected",

          label:
            copy.rejected,

          value:
            summary.rejected,
        },
      ],
      [
        copy.total,
        copy.pending,
        copy.reviewing,
        copy.accepted,
        copy.rejected,
        summary,
      ],
    );

  /* =======================================================
     OPEN APPLICATION
     ======================================================= */

  async function openApplication(
    application:
      AdminApplication,
  ) {
    setSelected(
      application,
    );

    setStatusDraft(
      application.status,
    );

    setNotes(
      application.adminNotes ??
        "",
    );

    setDrawerLoading(
      true,
    );

    setInsight(null);
    setDetailTab("overview");

    setError("");
    setSuccess("");

    try {
      const [
        fresh,
        freshInsight,
      ] = await Promise.all([
        getAdminApplication(
          application.id,
          language,
        ),
        getAdminApplicationInsight(
          application.id,
          language,
        ),
      ]);

      setSelected(
        fresh,
      );

      setStatusDraft(
        fresh.status,
      );

      setNotes(
        fresh.adminNotes ??
          "",
      );

      setInsight(
        freshInsight,
      );
    } catch (
      openError
    ) {
      setError(
        openError instanceof
          Error
          ? openError.message
          : "Unable to load application.",
      );
    } finally {
      setDrawerLoading(
        false,
      );
    }
  }

  /* =======================================================
     CLOSE DRAWER
     ======================================================= */

  function closeDrawer() {
    if (
      saving
    ) {
      return;
    }

    setSelected(null);

    setInsight(null);
    setDetailTab("overview");

    setNotes("");

    setDocumentLoading(
      null,
    );
  }

  /* =======================================================
     UPDATE APPLICATION
     ======================================================= */

  async function saveApplication(
    nextStatus?:
      ApplicationStatus,
  ) {
    if (
      !selected ||
      saving
    ) {
      return;
    }

    const targetStatus =
      nextStatus ??
      statusDraft;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updated =
        await updateAdminApplication(
          selected.id,
          {
            status:
              targetStatus,

            adminNotes:
              notes,
          },
          language,
        );

      setSelected(
        updated,
      );

      setStatusDraft(
        updated.status,
      );

      setNotes(
        updated.adminNotes,
      );

      /*
        Update the visible row immediately.
      */

      setApplications(
        (
          current,
        ) =>
          current.map(
            (
              application,
            ) =>
              application.id ===
              updated.id
                ? updated
                : application,
          ),
      );

      setSuccess(
        copy.updated,
      );

      /*
        Then refresh from the backend so summary counters
        and filtering stay completely accurate.
      */

      await refreshApplications();
    } catch (
      saveError
    ) {
      setError(
        saveError instanceof
          Error
          ? saveError.message
          : "Unable to update application.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     VIEW PRIVATE DOCUMENT
     ======================================================= */

  async function viewDocument(
    side:
      ApplicationDocumentSide,
  ) {
    if (
      !selected ||
      documentLoading
    ) {
      return;
    }

    /*
      Open the window immediately from the click.

      If we waited until after fetch(), some browsers could
      treat window.open() as a popup and block it.
    */

    const newTab =
      window.open(
        "",
        "_blank",
      );

    setDocumentLoading(
      side,
    );

    setError("");
    setSuccess("");

    try {
      const result =
        await getAdminApplicationDocument(
          selected.id,
          side,
          language,
        );

      if (
        newTab
      ) {
        newTab.opener =
          null;

        newTab.location.href =
          result.url;

        return;
      }

      window.location.href =
        result.url;
    } catch (
      documentError
    ) {
      newTab?.close();

      setError(
        documentError instanceof
          Error
          ? documentError.message
          : copy.documentError,
      );
    } finally {
      setDocumentLoading(
        null,
      );
    }
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <AdminShell>
      <section>
        {/* =================================================
            HEADER
            ================================================= */}

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

          <p className="mt-2 max-w-[620px] text-[9px] leading-5 text-black/35">
            {
              copy.description
            }
          </p>
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

        <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {statCards.map(
            (
              stat,
            ) => (
              <div
                key={
                  stat.key
                }
                className="rounded-2xl border border-black/[0.055] bg-white p-5 shadow-[0_6px_25px_rgba(30,45,22,0.02)]"
              >
                <span className="text-[7px] font-semibold text-black/30">
                  {
                    stat.label
                  }
                </span>

                <strong className="mt-3 block text-[22px] font-black tracking-[-0.04em] text-[#20251d]">
                  {
                    stat.value
                  }
                </strong>
              </div>
            ),
          )}
        </div>

        {/* =================================================
            APPLICATIONS
            ================================================= */}

        <div className="mt-5 overflow-hidden rounded-[20px] border border-black/[0.055] bg-white shadow-[0_8px_30px_rgba(30,45,22,0.025)]">
          {/* ===============================================
              FILTERS
              =============================================== */}

          <div className="flex flex-col gap-3 border-b border-black/[0.055] p-4 md:flex-row md:items-center md:justify-between">
            <label className="relative block w-full max-w-[430px]">
              <span className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/25">
                <SearchIcon />
              </span>

              <input
                type="search"
                value={
                  searchInput
                }
                onChange={(
                  event,
                ) => {
                  setSearchInput(
                    event.target.value,
                  );

                  setSuccess("");
                }}
                placeholder={
                  copy.search
                }
                className="h-11 w-full rounded-xl border border-black/[0.07] bg-[#fafbf8] pl-10 pr-4 text-[9px] font-medium text-[#252a22] outline-none transition focus:border-[#6e9a4e]/35 focus:bg-white focus:ring-4 focus:ring-[#6e9a4e]/[0.06]"
              />
            </label>

            <select
              value={
                statusFilter
              }
              onChange={(
                event,
              ) => {
                setStatusFilter(
                  event.target
                    .value as
                    ApplicationFilterStatus,
                );

                setPage(1);

                setSuccess("");
              }}
              className="h-11 rounded-xl border border-black/[0.07] bg-[#fafbf8] px-4 text-[9px] font-bold text-black/50 outline-none transition focus:border-[#6e9a4e]/35"
            >
              <option value="all">
                {
                  copy.all
                }
              </option>

              <option value="pending">
                {
                  copy.pending
                }
              </option>

              <option value="reviewing">
                {
                  copy.reviewing
                }
              </option>

              <option value="accepted">
                {
                  copy.accepted
                }
              </option>

              <option value="rejected">
                {
                  copy.rejected
                }
              </option>

              <option value="archived">
                {
                  copy.archived
                }
              </option>
            </select>
          </div>

          {/* ===============================================
              LOADING
              =============================================== */}

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-t-[#426c2b]" />
            </div>
          ) : applications.length ===
            0 ? (
            /* =============================================
               EMPTY
               ============================================= */

            <div className="flex min-h-[300px] items-center justify-center px-6 text-center">
              <div>
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef5e8] text-[#426c2b]">
                  <span className="h-5 w-5">
                    <UserIcon />
                  </span>
                </span>

                <strong className="mt-4 block text-[11px] font-black text-[#252a22]">
                  {
                    copy.noApplications
                  }
                </strong>

                <p className="mt-1.5 text-[8px] text-black/30">
                  {
                    copy.noApplicationsDescription
                  }
                </p>
              </div>
            </div>
          ) : (
            /* =============================================
               APPLICATION ROWS
               ============================================= */

            applications.map(
              (
                application,
              ) => (
                <article
                  key={
                    application.id
                  }
                  className="flex flex-col gap-4 border-b border-black/[0.05] p-4 transition hover:bg-[#fafcf8] last:border-b-0 lg:flex-row lg:items-center"
                >
                  {/* =======================================
                      APPLICANT
                      ======================================= */}

                  <div className="flex min-w-0 flex-1 items-center gap-3.5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#edf5e7] text-[#426c2b]">
                      <span className="h-4 w-4">
                        <UserIcon />
                      </span>
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="truncate text-[10px] font-black text-[#252a22]">
                          {
                            application.fullName
                          }
                        </strong>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-[6px] font-extrabold uppercase tracking-[0.08em] ${statusClass(
                            application.status,
                          )}`}
                        >
                          {
                            formatStatus(
                              application.status,
                            )
                          }
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[7.5px] text-black/30">
                        <span className="font-bold text-[#5f8745]">
                          {
                            application.applicationCode
                          }
                        </span>

                        <span className="h-1 w-1 rounded-full bg-black/15" />

                        <span className="break-all">
                          {
                            application.email
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      LOCATION
                      ======================================= */}

                  <div className="lg:w-[130px]">
                    <span className="block text-[6.5px] uppercase tracking-[0.1em] text-black/25">
                      {
                        copy.location
                      }
                    </span>

                    <strong className="mt-1 block text-[8px] font-bold text-black/50">
                      {
                        application.city
                      }
                    </strong>
                  </div>

                  {/* =======================================
                      SUBMITTED
                      ======================================= */}

                  <div className="lg:w-[165px]">
                    <span className="block text-[6.5px] uppercase tracking-[0.1em] text-black/25">
                      {
                        copy.submitted
                      }
                    </span>

                    <strong className="mt-1 block text-[8px] font-bold text-black/50">
                      {
                        formatDate(
                          application.createdAt,
                          language,
                        )
                      }
                    </strong>
                  </div>

                  {/* =======================================
                      REVIEW BUTTON
                      ======================================= */}

                  <button
                    type="button"
                    onClick={() =>
                      void openApplication(
                        application,
                      )
                    }
                    className="flex h-9 items-center justify-center rounded-xl border border-black/[0.07] bg-white px-4 text-[8px] font-extrabold text-black/50 transition hover:border-[#6e9a4e]/25 hover:bg-[#f6faf3] hover:text-[#426c2b]"
                  >
                    {
                      copy.review
                    }
                  </button>
                </article>
              ),
            )
          )}

          {/* ===============================================
              PAGINATION
              =============================================== */}

          {!loading &&
            pagination.total >
              0 && (
              <div className="flex items-center justify-between border-t border-black/[0.055] px-4 py-3.5">
                <span className="text-[8px] font-medium text-black/30">
                  {
                    copy.page
                  }{" "}
                  {
                    pagination.page
                  }{" "}
                  /{" "}
                  {
                    pagination.totalPages
                  }
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={
                      pagination.page <=
                      1
                    }
                    onClick={() => {
                      setPage(
                        (
                          current,
                        ) =>
                          Math.max(
                            1,
                            current -
                              1,
                          ),
                      );

                      setSuccess("");
                    }}
                    className="flex h-9 items-center gap-1.5 rounded-xl border border-black/[0.07] px-3 text-[8px] font-bold text-black/40 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <span className="h-3.5 w-3.5">
                      <ChevronIcon direction="left" />
                    </span>

                    {
                      copy.previous
                    }
                  </button>

                  <button
                    type="button"
                    disabled={
                      pagination.page >=
                      pagination.totalPages
                    }
                    onClick={() => {
                      setPage(
                        (
                          current,
                        ) =>
                          Math.min(
                            pagination.totalPages,
                            current +
                              1,
                          ),
                      );

                      setSuccess("");
                    }}
                    className="flex h-9 items-center gap-1.5 rounded-xl border border-black/[0.07] px-3 text-[8px] font-bold text-black/40 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    {
                      copy.next
                    }

                    <span className="h-3.5 w-3.5">
                      <ChevronIcon direction="right" />
                    </span>
                  </button>
                </div>
              </div>
            )}
        </div>
      </section>

      {/* ===================================================
          REVIEW DRAWER
          =================================================== */}

      {selected && (
        <div className="fixed inset-0 z-[120] flex justify-end bg-[#11150f]/35 backdrop-blur-[4px]">
          {/* ===============================================
              BACKDROP
              =============================================== */}

          <button
            type="button"
            aria-label="Close application review"
            onClick={
              closeDrawer
            }
            className="absolute inset-0"
          />

          {/* ===============================================
              DRAWER
              =============================================== */}

          <div className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-[#f8faf5] shadow-[-30px_0_90px_rgba(20,30,15,0.18)] sm:my-3 sm:mr-3 sm:h-[calc(100%-24px)] sm:max-w-[780px] sm:rounded-[26px] sm:border sm:border-black/[0.055]">
            {/* =============================================
                HEADER
                ============================================= */}

            <div className="flex shrink-0 items-center justify-between border-b border-black/[0.055] bg-white/95 px-5 py-5 backdrop-blur-xl sm:px-7 sm:py-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8bc84f] shadow-[0_0_0_4px_rgba(139,200,79,0.1)]" />

                  <span className="text-[7px] font-extrabold uppercase tracking-[0.18em] text-[#638d46]">
                    {
                      copy.application
                    }{" "}
                    {
                      selected.applicationCode
                    }
                  </span>
                </div>

                <h3 className="mt-2 truncate text-[22px] font-black tracking-[-0.045em] text-[#191d17]">
                  {
                    selected.fullName
                  }
                </h3>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[6px] font-extrabold uppercase tracking-[0.08em] ${statusClass(
                      selected.status,
                    )}`}
                  >
                    {
                      formatStatus(
                        selected.status,
                      )
                    }
                  </span>

                  <span className="text-[7px] text-black/30">
                    {
                      formatDate(
                        selected.createdAt,
                        language,
                      )
                    }
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  closeDrawer
                }
                disabled={
                  saving
                }
                aria-label="Close"
                className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/[0.07] bg-[#fafbf8] text-black/50 transition hover:bg-white hover:text-black disabled:opacity-50"
              >
                <span className="h-4 w-4">
                  <CloseIcon />
                </span>
              </button>
            </div>

            {/* =============================================
                BODY
                ============================================= */}

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
              {drawerLoading ? (
                <div className="flex min-h-[420px] items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-t-[#426c2b]" />
                </div>
              ) : (
                <>
                  {insight?.representative && (
                    <div className="mx-auto mb-5 max-w-[700px]">
                      <AdminPartnerInsight
                        insight={insight}
                        activeTab={detailTab}
                        onTabChange={setDetailTab}
                        language={language}
                      />
                    </div>
                  )}

                  <div
                    className={`mx-auto max-w-[700px] space-y-5 ${
                      detailTab === "overview" ? "" : "hidden"
                    }`}
                  >
                  {/* =======================================
                      PERSONAL INFORMATION
                      ======================================= */}

                  <section className="rounded-[20px] border border-black/[0.055] bg-white p-5">
                    <h4 className="text-[11px] font-black tracking-[-0.025em] text-[#22271f]">
                      {
                        copy.personal
                      }
                    </h4>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <InfoItem
                        label={
                          copy.fullName
                        }
                        value={
                          selected.fullName
                        }
                      />

                      <InfoItem
                        label={
                          copy.fatherName
                        }
                        value={
                          selected.fatherName
                        }
                      />

                      <InfoItem
                        label={
                          copy.email
                        }
                        value={
                          selected.email
                        }
                      />

                      <InfoItem
                        label={
                          copy.phone
                        }
                        value={
                          selected.phone
                        }
                      />

                      <InfoItem
                        label={
                          copy.city
                        }
                        value={
                          selected.city
                        }
                      />

                      <InfoItem
                        label={
                          copy.address
                        }
                        value={
                          selected.address
                        }
                      />
                    </div>
                  </section>

                  {/* =======================================
                      CONTACT INFORMATION
                      ======================================= */}

                  <section className="rounded-[20px] border border-black/[0.055] bg-white p-5">
                    <h4 className="text-[11px] font-black tracking-[-0.025em] text-[#22271f]">
                      {
                        copy.contact
                      }
                    </h4>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <InfoItem
                        label={
                          copy.telegram
                        }
                        value={
                          selected.telegram
                        }
                      />

                      <InfoItem
                        label={
                          copy.whatsapp
                        }
                        value={
                          selected.whatsapp
                        }
                      />
                    </div>
                  </section>

                  {/* =======================================
                      MOTIVATION
                      ======================================= */}

                  <section className="rounded-[20px] border border-black/[0.055] bg-white p-5">
                    <h4 className="text-[11px] font-black tracking-[-0.025em] text-[#22271f]">
                      {
                        copy.motivation
                      }
                    </h4>

                    <p className="mt-3 whitespace-pre-wrap text-[9px] leading-6 text-black/50">
                      {
                        selected.motivation
                      }
                    </p>
                  </section>

                  {/* =======================================
                      IDENTITY
                      ======================================= */}

                  <section className="rounded-[20px] border border-black/[0.055] bg-white p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf5e7] text-[#426c2b]">
                        <span className="h-4 w-4">
                          <IdIcon />
                        </span>
                      </span>

                      <div>
                        <h4 className="text-[11px] font-black tracking-[-0.025em] text-[#22271f]">
                          {
                            copy.identity
                          }
                        </h4>

                        <span className="mt-0.5 block text-[7.5px] text-black/30">
                          {
                            selected.idType
                          }
                        </span>
                      </div>
                    </div>

                    {/* =====================================
                        DOCUMENT BUTTONS
                        ===================================== */}

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        disabled={
                          !selected
                            .documents
                            .front ||
                          Boolean(
                            documentLoading,
                          )
                        }
                        onClick={() =>
                          void viewDocument(
                            "front",
                          )
                        }
                        className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#6f9a52]/15 bg-[#f4f8f1] text-[8px] font-extrabold text-[#426c2b] transition hover:bg-[#edf5e7] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {documentLoading ===
                        "front" ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#426c2b]/20 border-t-[#426c2b]" />
                        ) : (
                          <span className="h-4 w-4">
                            <EyeIcon />
                          </span>
                        )}

                        {
                          copy.viewFront
                        }
                      </button>

                      <button
                        type="button"
                        disabled={
                          !selected
                            .documents
                            .back ||
                          Boolean(
                            documentLoading,
                          )
                        }
                        onClick={() =>
                          void viewDocument(
                            "back",
                          )
                        }
                        className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#6f9a52]/15 bg-[#f4f8f1] text-[8px] font-extrabold text-[#426c2b] transition hover:bg-[#edf5e7] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {documentLoading ===
                        "back" ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#426c2b]/20 border-t-[#426c2b]" />
                        ) : (
                          <span className="h-4 w-4">
                            <EyeIcon />
                          </span>
                        )}

                        {
                          copy.viewBack
                        }
                      </button>
                    </div>

                    {/* =====================================
                        RULES INFORMATION
                        ===================================== */}

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <InfoItem
                        label={
                          copy.rules
                        }
                        value={
                          selected.rulesAccepted
                            ? copy.yes
                            : "—"
                        }
                      />

                      <InfoItem
                        label={
                          copy.submitted
                        }
                        value={
                          formatDate(
                            selected.rulesAcceptedAt,
                            language,
                          )
                        }
                      />
                    </div>
                  </section>

                  {/* =======================================
                      ADMIN REVIEW
                      ======================================= */}

                  <section className="rounded-[20px] border border-black/[0.055] bg-white p-5">
                    <h4 className="text-[11px] font-black tracking-[-0.025em] text-[#22271f]">
                      {
                        copy.adminReview
                      }
                    </h4>

                    <div className="mt-4">
                      {/* ===================================
                          STATUS
                          =================================== */}

                      <label className="block">
                        <span className="mb-2 block text-[7px] font-extrabold uppercase tracking-[0.12em] text-black/30">
                          {
                            copy.status
                          }
                        </span>

                        <select
                          value={
                            statusDraft
                          }
                          disabled={
                            saving
                          }
                          onChange={(
                            event,
                          ) => {
                            setStatusDraft(
                              event.target
                                .value as
                                ApplicationStatus,
                            );

                            setSuccess("");
                          }}
                          className="h-11 w-full rounded-xl border border-black/[0.07] bg-[#fafbf8] px-4 text-[9px] font-bold text-[#252a22] outline-none transition focus:border-[#6e9a4e]/35 focus:bg-white focus:ring-4 focus:ring-[#6e9a4e]/[0.06]"
                        >
                          <option value="pending">
                            {
                              copy.pending
                            }
                          </option>

                          <option value="reviewing">
                            {
                              copy.reviewing
                            }
                          </option>

<option
  value="accepted"
  disabled
>
  {
    copy.accepted
  }
</option>

                          <option value="rejected">
                            {
                              copy.rejected
                            }
                          </option>

                          <option value="archived">
                            {
                              copy.archived
                            }
                          </option>
                        </select>
                      </label>

                      {/* ===================================
                          NOTES
                          =================================== */}

                      <label className="mt-4 block">
                        <span className="mb-2 block text-[7px] font-extrabold uppercase tracking-[0.12em] text-black/30">
                          {
                            copy.notes
                          }
                        </span>

                        <textarea
                          rows={5}
                          maxLength={5000}
                          value={
                            notes
                          }
                          disabled={
                            saving
                          }
                          onChange={(
                            event,
                          ) => {
                            setNotes(
                              event.target.value,
                            );

                            setSuccess("");
                          }}
                          placeholder={
                            copy.notesPlaceholder
                          }
                          className="min-h-[120px] w-full resize-y rounded-xl border border-black/[0.07] bg-[#fafbf8] px-4 py-3 text-[9px] leading-5 text-[#252a22] outline-none transition placeholder:text-black/20 focus:border-[#6e9a4e]/35 focus:bg-white focus:ring-4 focus:ring-[#6e9a4e]/[0.06]"
                        />
                      </label>

                      {/* ===================================
                          REVIEW DATE
                          =================================== */}

                      {selected.reviewedAt && (
                        <p className="mt-3 text-[7px] text-black/25">
                          {
                            copy.reviewed
                          }
                          :{" "}
                          {
                            formatDate(
                              selected.reviewedAt,
                              language,
                            )
                          }
                        </p>
                      )}
                    </div>
                  </section>
                  </div>
                </>
              )}
            </div>

            {/* =============================================
                FOOTER
                ============================================= */}

            {!drawerLoading && (
              <div className="shrink-0 border-t border-black/[0.055] bg-white/95 px-5 py-4 backdrop-blur-xl sm:px-7">
                <div className="mx-auto flex max-w-[700px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  {/* =======================================
                      QUICK STATUS ACTIONS
                      ======================================= */}

                  <div className="grid grid-cols-3 gap-2 sm:flex">
                    <button
                      type="button"
                      disabled={
                        saving
                      }
                      onClick={() =>
                        void saveApplication(
                          "rejected",
                        )
                      }
                      className="h-10 rounded-xl border border-red-200 bg-red-50 px-3 text-[7.5px] font-extrabold text-red-500 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {
                        copy.reject
                      }
                    </button>

                    <button
                      type="button"
                      disabled={
                        saving
                      }
                      onClick={() =>
                        void saveApplication(
                          "reviewing",
                        )
                      }
                      className="h-10 rounded-xl border border-[#6a91cb]/15 bg-[#edf4ff] px-3 text-[7.5px] font-extrabold text-[#426da9] transition hover:bg-[#e4efff] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {
                        copy.markReviewing
                      }
                    </button>

{selected.status !== "accepted" && (
<AcceptRepresentativeButton
  applicationId={
    selected.id
  }
  disabled={
    saving
  }
  label={
    copy.accept
  }
  onAccepted={async () => {
    const [
      fresh,
      freshInsight,
    ] = await Promise.all([
      getAdminApplication(
        selected.id,
        language,
      ),
      getAdminApplicationInsight(
        selected.id,
        language,
      ),
    ]);

    setSelected(
      fresh,
    );
    setStatusDraft(
      fresh.status,
    );
    setNotes(
      fresh.adminNotes ??
        "",
    );
    setInsight(
      freshInsight,
    );
    await refreshApplications();
  }}
 />
)}
                  </div>

                  {/* =======================================
                      SAVE
                      ======================================= */}

                  <button
                    type="button"
                    disabled={
                      saving
                    }
                    onClick={() =>
                      void saveApplication()
                    }
                    className="h-11 min-w-[130px] rounded-xl bg-[#426c2b] px-5 text-[8px] font-extrabold text-white shadow-[0_8px_22px_rgba(66,108,43,0.18)] transition hover:bg-[#355923] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? copy.saving
                      : copy.save}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
