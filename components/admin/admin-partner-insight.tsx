"use client";

import {
  useEffect,
  useState,
} from "react";

import Image from "next/image";

import type {
  AdminApplicationInsight,
} from "@/lib/admin-applications-api";

import {
  addAdminVerifiedSale,
  reverseAdminVerifiedSale,
} from "@/lib/admin-applications-api";

import PartnerRankBadge from "@/components/representative/partner-rank-badge";
import BanPartnerDialog from "@/components/admin/ban-partner-dialog";
import ConfirmDestructiveDialog from "@/components/admin/confirm-destructive-dialog";

import {
  getPartnerModeration,
  unbanAdminPartner,
  type PartnerModerationProfile,
} from "@/lib/admin-partner-moderation-api";

export type AdminPartnerDetailTab =
  | "overview"
  | "activity"
  | "reports"
  | "leads"
  | "training"
  | "programs";

const tabs: Array<{
  key: AdminPartnerDetailTab;
  label: string;
}> = [
  {
    key: "overview",
    label: "Overview",
  },
  {
    key: "activity",
    label: "Activity",
  },
  {
    key: "reports",
    label: "Reports",
  },
  {
    key: "leads",
    label: "Leads",
  },
  {
    key: "training",
    label: "Training",
  },
  {
    key: "programs",
    label: "Programs",
  },
];

function formatDate(
  value: string | null,
  language: "en" | "am",
) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat(
    language === "am" ? "am-ET" : "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function EmptyState({
  children,
}: {
  children: string;
}) {
  return (
    <div className="rounded-[18px] border border-dashed border-black/10 bg-white px-5 py-10 text-center text-[11px] leading-5 text-black/48">
      {children}
    </div>
  );
}

export default function AdminPartnerInsight({
  insight,
  activeTab,
  onTabChange,
  language,
  applicationId,
  onRefresh,
}: {
  insight: AdminApplicationInsight;
  activeTab: AdminPartnerDetailTab;
  onTabChange: (tab: AdminPartnerDetailTab) => void;
  language: "en" | "am";
  applicationId: string;
  onRefresh: () => Promise<void>;
}) {
  const representative = insight.representative;
  const representativeId = representative?.id;
  const summary = insight.summary;
  const performance = insight.performance;
  const [savingSale, setSavingSale] = useState(false);
  const [saleError, setSaleError] = useState("");
  const [moderation, setModeration] = useState<PartnerModerationProfile | null>(null);
  const [moderationError, setModerationError] = useState("");
  const [banOpen, setBanOpen] = useState(false);
  const [unbanOpen, setUnbanOpen] = useState(false);
  const [moderationBusy, setModerationBusy] = useState(false);

  async function refreshModeration() {
    if (!representativeId) return;
    try {
      setModeration(await getPartnerModeration(representative.id, language));
      setModerationError("");
    } catch (error) {
      setModerationError(error instanceof Error ? error.message : "Unable to load Partner access status.");
    }
  }

  useEffect(() => {
    if (!representativeId) return;
    const currentRepresentativeId = representativeId;
    let cancelled = false;

    void getPartnerModeration(currentRepresentativeId, language)
      .then((result) => {
        if (!cancelled) {
          setModeration(result);
          setModerationError("");
        }
      })
      .catch((error) => {
        if (!cancelled) setModerationError(error instanceof Error ? error.message : "Unable to load Partner access status.");
      });

    return () => {
      cancelled = true;
    };
  }, [representativeId, language]);

  if (!representative || !summary || !performance) {
    return null;
  }

  async function addSale() {
    if (savingSale) return;

    setSavingSale(true);
    setSaleError("");

    try {
      await addAdminVerifiedSale(applicationId, language);
      await onRefresh();
    } catch (error) {
      setSaleError(
        error instanceof Error
          ? error.message
          : language === "am"
            ? "የተረጋገጠ ሽያጭ ማከል አልተቻለም።"
            : "Unable to add the verified sale.",
      );
    } finally {
      setSavingSale(false);
    }
  }

  async function reverseSale(saleId: string) {
    if (savingSale) return;

    setSavingSale(true);
    setSaleError("");

    try {
      await reverseAdminVerifiedSale(applicationId, saleId, language);
      await onRefresh();
    } catch (error) {
      setSaleError(
        error instanceof Error
          ? error.message
          : language === "am"
            ? "የተረጋገጠውን ሽያጭ መቀልበስ አልተቻለም።"
            : "Unable to reverse the verified sale.",
      );
    } finally {
      setSavingSale(false);
    }
  }

  async function unban() {
    if (!representative) return;
    setModerationBusy(true);
    setModerationError("");
    try {
      await unbanAdminPartner(representative.id, language);
      setUnbanOpen(false);
      await Promise.all([refreshModeration(), onRefresh()]);
    } catch (error) {
      setModerationError(error instanceof Error ? error.message : "Unable to restore Partner access.");
    } finally {
      setModerationBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[20px] border border-black/[0.055] bg-white">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-[#edf5e7] text-[13px] font-black text-[#426c2b]">
              {representative.avatarUrl ? (
                <Image
                  src={representative.avatarUrl}
                  alt={`${representative.effectiveName} avatar`}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                representative.effectiveName
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part.charAt(0))
                  .join("")
                  .toUpperCase()
              )}
            </span>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="truncate text-[15px] font-black tracking-[-0.035em] text-[#22271f]">
                  {representative.effectiveName}
                </h4>

                <span
                  className={`rounded-full px-2 py-1 text-[9px] font-extrabold ${
                    representative.active
                      ? "bg-[#edf6e8] text-[#426c2b]"
                      : "bg-black/[0.05] text-black/45"
                  }`}
                >
                  {representative.active ? "Active" : "Inactive"}
                </span>

                {moderation?.active && (
                  <span className="rounded-full bg-red-50 px-2 py-1 text-[9px] font-extrabold text-red-650">
                    {moderation.active.isPermanent
                      ? language === "am" ? "ቋሚ እገዳ" : "Banned"
                      : language === "am" ? "ጊዜያዊ እገዳ" : "Temporarily banned"}
                  </span>
                )}

                <PartnerRankBadge
                  rank={performance.rank}
                  language={language}
                />
              </div>

              <p className="mt-1 truncate text-[10px] text-black/48">
                {representative.partnerId} · Last activity {formatDate(
                  representative.lastActivityAt,
                  language,
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
            {[
              ["Reports", summary.reports],
              ["Lessons", `${summary.completedLessons}/${summary.totalLessons}`],
              ["Courses", insight.training.filter((course) => course.progress.percent === 100).length],
              ["Training", `${summary.trainingPercent}%`],
              ["Programs", summary.activePrograms],
              ["Leads", "N/A"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[13px] bg-[#f6f8f3] px-3 py-2.5 text-center"
              >
                <strong className="block text-[13px] font-black text-[#426c2b]">
                  {value}
                </strong>
                <span className="mt-0.5 block text-[9px] font-bold text-black/42">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-px border-t border-black/[0.055] bg-black/[0.055] sm:grid-cols-3">
          {[
            ["Joined", formatDate(representative.createdAt, language)],
            ["Last login", formatDate(representative.lastLoginAt, language)],
            ["Language", representative.preferredLanguage === "am" ? "Amharic" : "English"],
            ["Commission", "20–25% on qualifying sales"],
            ["Account", representative.active ? "Active partner" : "Inactive partner"],
            ["Email", representative.email],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0 bg-white px-4 py-3">
              <dt className="text-[9px] font-bold text-black/38">{label}</dt>
              <dd className="mt-1 truncate text-[10px] font-extrabold text-[#30372d]" title={String(value)}>
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="overflow-x-auto border-t border-black/[0.055] px-3">
          <nav
            aria-label="Partner record sections"
            className="flex min-w-max gap-1 py-2"
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                className={`rounded-xl px-3 py-2 text-[10px] font-extrabold transition ${
                  activeTab === tab.key
                    ? "bg-[#426c2b] text-white"
                    : "text-black/50 hover:bg-[#f1f5ed] hover:text-[#426c2b]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </section>

      {activeTab === "overview" && (
        <div className="space-y-4">
        <section className="rounded-[20px] border border-black/[0.055] bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.13em] text-[#638d46]">
                {language === "am" ? "አፈጻጸም" : "Performance"}
              </span>
              <h4 className="mt-1.5 text-[15px] font-black tracking-[-0.035em] text-[#252a22]">
                {language === "am" ? "የአጋር ደረጃ" : "Partner standing"}
              </h4>
            </div>
            <PartnerRankBadge rank={performance.rank} language={language} />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[16px] bg-[#f6f8f3] p-4">
              <span className="text-[9px] font-bold text-black/42">
                {language === "am" ? "የተረጋገጡ ሽያጮች" : "Verified sales"}
              </span>
              <strong className="mt-2 block text-[24px] font-black text-[#426c2b]">
                {performance.verifiedSales}
              </strong>
            </div>
            <div className="rounded-[16px] bg-[#f6f8f3] p-4">
              <span className="text-[9px] font-bold text-black/42">
                {language === "am" ? "ሪፖርቶች" : "Reports"}
              </span>
              <strong className="mt-2 block text-[24px] font-black text-[#426c2b]">
                {performance.reports}
              </strong>
              <span className="mt-1 block text-[8px] text-black/35">
                {language === "am" ? "በራስ-ሰር የተቆጠረ" : "Automatically calculated"}
              </span>
            </div>
            <div className="rounded-[16px] bg-[#f6f8f3] p-4">
              <span className="text-[9px] font-bold text-black/42">
                {language === "am" ? "ደረጃ" : "Rank"}
              </span>
              <div className="mt-3">
                <PartnerRankBadge rank={performance.rank} language={language} />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={savingSale || performance.verifiedSales === 0}
              onClick={() => {
                const latestActive = performance.sales.find((sale) => sale.status === "active");
                if (latestActive) void reverseSale(latestActive.id);
              }}
              aria-label={language === "am" ? "የቅርብ ጊዜውን ሽያጭ ቀልብስ" : "Reverse latest verified sale"}
              className="h-10 rounded-xl border border-black/10 px-4 text-[11px] font-black text-black/45 disabled:opacity-35"
            >
              −
            </button>
            <span className="min-w-10 text-center text-[16px] font-black text-[#2b3228]">
              {performance.verifiedSales}
            </span>
            <button
              type="button"
              disabled={savingSale}
              onClick={() => void addSale()}
              className="h-10 rounded-xl bg-[#426c2b] px-4 text-[10px] font-extrabold text-white disabled:opacity-50"
            >
              {savingSale
                ? language === "am" ? "በማስቀመጥ ላይ…" : "Saving…"
                : language === "am" ? "+ ሽያጭ ጨምር" : "+ Add Sale"}
            </button>
          </div>

          {saleError && (
            <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[10px] text-red-600">
              {saleError}
            </p>
          )}

          {performance.sales.length > 0 && (
            <div className="mt-5 space-y-2 border-t border-black/[0.055] pt-4">
              {performance.sales.slice(0, 8).map((sale) => (
                <div
                  key={sale.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[13px] bg-[#f7f9f5] px-3.5 py-3"
                >
                  <div>
                    <strong className="block text-[10px] text-[#30372d]">
                      {sale.reference || (language === "am" ? "የተረጋገጠ ሽያጭ" : "Verified sale")}
                    </strong>
                    <span className="mt-1 block text-[8px] text-black/38">
                      {formatDate(sale.addedAt, language)} · {sale.status}
                    </span>
                  </div>
                  {sale.status === "active" && (
                    <button
                      type="button"
                      disabled={savingSale}
                      onClick={() => void reverseSale(sale.id)}
                      className="rounded-lg border border-red-200 px-2.5 py-1.5 text-[9px] font-extrabold text-red-600 disabled:opacity-50"
                    >
                      {language === "am" ? "ሽያጩን ቀልብስ" : "Reverse sale"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[20px] border border-black/[0.055] bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.13em] text-[#638d46]">
                {language === "am" ? "የመለያ መዳረሻ" : "Account access"}
              </span>
              <h4 className="mt-1.5 text-[15px] font-black tracking-[-0.035em] text-[#252a22]">
                {moderation?.active
                  ? language === "am" ? "Partnerው ታግዷል" : "Partner access is suspended"
                  : language === "am" ? "Partnerው መዳረሻ አለው" : "Partner access is active"}
              </h4>
              <p className="mt-2 max-w-[650px] text-[10px] leading-5 text-black/48">
                {moderation?.active
                  ? `${moderation.active.reason} · ${moderation.active.isPermanent ? (language === "am" ? "ቋሚ" : "Permanent") : formatDate(moderation.active.bannedUntil, language)}`
                  : language === "am"
                    ? "Portal እና Partner Chat መዳረሻው ክፍት ነው።"
                    : "Portal and Partner Chat access are available."}
              </p>
            </div>
            {moderation?.active ? (
              <button type="button" onClick={() => setUnbanOpen(true)} className="h-10 rounded-xl border border-[#6f9d52]/25 bg-[#f2f8ed] px-4 text-[10px] font-extrabold text-[#426c2b]">
                {language === "am" ? "እገዳ አንሳ" : "Unban Partner"}
              </button>
            ) : (
              <button type="button" onClick={() => setBanOpen(true)} className="h-10 rounded-xl border border-red-200 bg-red-50 px-4 text-[10px] font-extrabold text-red-650">
                {language === "am" ? "Partner እገድ" : "Ban Partner"}
              </button>
            )}
          </div>

          {moderationError && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[10px] text-red-650">{moderationError}</p>}

          {moderation && moderation.history.length > 0 && (
            <div className="mt-5 border-t border-black/[0.055] pt-4">
              <h5 className="text-[10px] font-black text-[#30372d]">{language === "am" ? "የእገዳ ታሪክ" : "Ban history"}</h5>
              <div className="mt-2 space-y-2">
                {moderation.history.slice(0, 8).map((ban) => (
                  <div key={ban.id} className="flex flex-col gap-2 rounded-[13px] bg-[#f7f9f5] px-3.5 py-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <strong className="block text-[10px] text-[#30372d]">{ban.reason}</strong>
                      <span className="mt-1 block text-[8px] text-black/38">{ban.bannedByName || "Admin"} · {formatDate(ban.startedAt, language)}</span>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[8px] font-extrabold ${!ban.endedAt ? "bg-red-50 text-red-650" : "bg-black/[0.05] text-black/45"}`}>
                      {!ban.endedAt
                        ? ban.isPermanent ? (language === "am" ? "ቋሚ" : "Permanent") : (language === "am" ? "ንቁ" : "Active")
                        : ban.endReason === "expired" ? (language === "am" ? "ጊዜው አልቋል" : "Expired") : (language === "am" ? "ተነስቷል" : "Unbanned")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
        </div>
      )}

      {activeTab === "activity" && (
        <section className="space-y-2.5">
          {insight.activity.map((event) => (
            <article
              key={`${event.type}-${event.entityId}-${event.createdAt}`}
              className="flex items-start justify-between gap-4 rounded-[17px] border border-black/[0.055] bg-white p-4"
            >
              <div className="min-w-0">
                <strong className="block text-[11px] font-extrabold text-[#252a22]">
                  {event.label}
                </strong>
                <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.08em] text-black/35">
                  {event.type.replaceAll("_", " ")}
                </span>
              </div>
              <time className="shrink-0 text-right text-[9px] leading-4 text-black/42">
                {formatDate(event.createdAt, language)}
              </time>
            </article>
          ))}

          {insight.activity.length === 0 && (
            <EmptyState>No partner activity has been recorded yet.</EmptyState>
          )}
        </section>
      )}

      {activeTab === "reports" && (
        <section className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Submitted", summary.reports],
              ["Unread", summary.unreadReports],
              ["Last report", formatDate(summary.lastReportAt, language)],
              ["Reply coverage", insight.reports.filter((report) => report.replyCount > 0).length],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[16px] border border-black/[0.055] bg-white p-3.5"
              >
                <span className="block text-[9px] font-bold text-black/42">{label}</span>
                <strong className="mt-1.5 block text-[12px] font-black text-[#2a3126]">{value}</strong>
              </div>
            ))}
          </div>

          {insight.reports.map((report) => (
            <article
              key={report.id}
              className="rounded-[18px] border border-black/[0.055] bg-white p-4.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <time className="text-[9px] font-bold text-black/40">
                  {formatDate(report.createdAt, language)}
                </time>
                <div className="flex items-center gap-1.5">
                  <span className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold ${
                    report.adminReadAt
                      ? "bg-[#edf5e7] text-[#426c2b]"
                      : "bg-amber-50 text-amber-700"
                  }`}>
                    {report.adminReadAt ? "Read" : "Unread"}
                  </span>
                  <span className="rounded-full bg-[#edf5e7] px-2.5 py-1 text-[9px] font-extrabold text-[#426c2b]">
                    {report.replyCount} {report.replyCount === 1 ? "reply" : "replies"}
                  </span>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-[11px] leading-5 text-[#353b32]">
                {report.message}
              </p>

              {report.replies.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-black/[0.055] pt-3">
                  {report.replies.map((reply) => (
                    <div key={reply.id} className="rounded-xl bg-[#f4f8f1] px-3.5 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <strong className="text-[9px] font-extrabold text-[#426c2b]">
                          Admin reply
                        </strong>
                        <time className="text-[8px] text-black/38">
                          {formatDate(reply.createdAt, language)}
                        </time>
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap text-[10px] leading-5 text-black/58">
                        {reply.message}
                      </p>
                      <span className="mt-1.5 block text-[8px] font-bold text-black/32">
                        {reply.representativeReadAt ? "Read by partner" : "Not yet read by partner"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}

          {insight.reports.length === 0 && (
            <EmptyState>No reports have been submitted by this partner.</EmptyState>
          )}
        </section>
      )}

      {activeTab === "leads" && (
        <section className="rounded-[20px] border border-[#d9e7cf] bg-[#f5f9f1] p-5">
          <span className="text-[9px] font-black uppercase tracking-[0.12em] text-[#638d46]">
            Data source unavailable
          </span>
          <h4 className="mt-2 text-[14px] font-black tracking-[-0.025em] text-[#252a22]">
            Lead analytics are intentionally not shown
          </h4>
          <p className="mt-2 text-[11px] leading-5 text-black/52">
            {insight.leads.reason}
          </p>
        </section>
      )}

      {activeTab === "training" && (
        <section className="space-y-3">
          <div className="rounded-[18px] border border-black/[0.055] bg-white p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <span className="text-[9px] font-bold text-black/42">Overall training progress</span>
                <strong className="mt-1 block text-[22px] font-black tracking-[-0.04em] text-[#426c2b]">
                  {summary.trainingPercent}%
                </strong>
              </div>
              <span className="text-[10px] font-bold text-black/45">
                {summary.completedLessons}/{summary.totalLessons} lessons
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/[0.06]">
              <div
                className="h-full rounded-full bg-[#70a650]"
                style={{ width: `${summary.trainingPercent}%` }}
              />
            </div>
          </div>

          {insight.training.map((course) => {
            const completedSections = course.sections.filter(
              (section) =>
                section.lessons.length > 0 &&
                section.lessons.every((lesson) => lesson.completed),
            ).length;
            const lastTrainingAt = course.sections
              .flatMap((section) => section.lessons)
              .map((lesson) => lesson.updatedAt)
              .filter((value): value is string => Boolean(value))
              .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null;

            return (
              <details
              key={course.id}
              className="group rounded-[18px] border border-black/[0.055] bg-white p-4"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <div className="min-w-0">
                  <strong className="block truncate text-[12px] font-black text-[#252a22]">
                    {language === "am" ? course.titleAm : course.titleEn}
                  </strong>
                  <span className="mt-1 block text-[9px] text-black/42">
                    {completedSections}/{course.sections.length} sections · {course.progress.completedLessons}/{course.progress.totalLessons} lessons · Last activity {formatDate(lastTrainingAt, language)}
                  </span>
                </div>
                <span className="rounded-full bg-[#edf5e7] px-3 py-1.5 text-[10px] font-black text-[#426c2b]">
                  {course.progress.percent}%
                </span>
              </summary>

              <div className="mt-4 space-y-3 border-t border-black/[0.055] pt-4">
                {course.sections.map((section) => (
                  <div key={section.id}>
                    <h5 className="text-[10px] font-black text-[#3c4438]">
                      {language === "am" ? section.titleAm : section.titleEn}
                    </h5>
                    <div className="mt-2 space-y-1.5">
                      {section.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between gap-3 rounded-xl bg-[#f7f9f5] px-3 py-2.5"
                        >
                          <span className="min-w-0 truncate text-[10px] font-semibold text-black/58">
                            {language === "am" ? lesson.titleAm : lesson.titleEn}
                          </span>
                          <span
                            className={`shrink-0 text-[9px] font-extrabold ${
                              lesson.completed ? "text-[#426c2b]" : "text-black/32"
                            }`}
                          >
                            {lesson.completed
                              ? `Completed ${formatDate(lesson.completedAt, language)}`
                              : lesson.watchedSeconds > 0
                                ? `In progress · ${lesson.watchedSeconds}s watched`
                                : "Not started"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              </details>
            );
          })}

          {insight.training.length === 0 && (
            <EmptyState>No published training courses are available.</EmptyState>
          )}
        </section>
      )}

      {activeTab === "programs" && (
        <section className="space-y-3">
          {insight.programs.map((program) => (
            <article
              key={program.id}
              className="rounded-[18px] border border-black/[0.055] bg-white p-4.5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <strong className="block text-[12px] font-black text-[#252a22]">
                    {program.title}
                  </strong>
                  <p className="mt-1.5 text-[10px] leading-5 text-black/46">
                    {program.description || "No description provided."}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[#edf5e7] px-2.5 py-1 text-[9px] font-extrabold capitalize text-[#426c2b]">
                  {program.effectiveStatus}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
                  <span
                    className="block h-full rounded-full bg-[#70a650]"
                    style={{ width: `${program.progressPercent}%` }}
                  />
                </span>
                <strong className="text-[11px] font-black text-[#426c2b]">
                  {program.progressPercent}%
                </strong>
              </div>
              <p className="mt-2 text-[9px] text-black/38">
                {program.startDate} – {program.endDate}
              </p>

              {program.targets.length > 0 && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {program.targets.map((target) => (
                    <div key={target.id} className="rounded-xl bg-[#f7f9f5] px-3 py-2.5">
                      <span className="block text-[9px] font-bold text-black/42">
                        {target.targetType === "reports"
                          ? "Reports"
                          : target.targetType === "lessons"
                            ? "Lessons completed"
                            : target.courseTitleEn || "Course completion"}
                      </span>
                      <strong className="mt-1 block text-[10px] font-black text-[#426c2b]">
                        {target.actualValue}/{target.targetValue}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}

          {insight.programs.length === 0 && (
            <EmptyState>This partner is not assigned to a program.</EmptyState>
          )}
        </section>
      )}

      <BanPartnerDialog
        open={banOpen}
        representativeId={representative.id}
        partnerName={representative.effectiveName}
        language={language}
        onClose={() => setBanOpen(false)}
        onBanned={async () => {
          await Promise.all([refreshModeration(), onRefresh()]);
        }}
      />

      <ConfirmDestructiveDialog
        open={unbanOpen}
        title={language === "am" ? "የPartner መዳረሻ ይመለስ?" : "Restore Partner access?"}
        description={language === "am" ? "የPortal እና Partner Chat መዳረሻው ወዲያውኑ ይመለሳል።" : "Portal and Partner Chat access will be restored immediately."}
        confirmLabel={language === "am" ? "እገዳ አንሳ" : "Unban Partner"}
        cancelLabel={language === "am" ? "ይቅር" : "Cancel"}
        busy={moderationBusy}
        onClose={() => setUnbanOpen(false)}
        onConfirm={() => void unban()}
      />
    </div>
  );
}
