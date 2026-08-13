"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock3,
  EyeOff,
  Flag,
  Loader2,
  MessageSquareWarning,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import BanPartnerDialog from "@/components/admin/ban-partner-dialog";
import { useLanguage } from "@/components/providers/language-provider";
import PartnerRankBadge from "@/components/representative/partner-rank-badge";

import {
  getAdminChatReports,
  reviewAdminChatReport,
  type AdminChatReport,
  type AdminChatReportStatus,
} from "@/lib/admin-chat-reports-api";

function formatDate(value: string, language: "en" | "am") {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(language === "am" ? "am-ET" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default function AdminChatReports() {
  const { language } = useLanguage();
  const [status, setStatus] = useState<AdminChatReportStatus>("pending");
  const [reports, setReports] = useState<AdminChatReport[]>([]);
  const [selected, setSelected] = useState<AdminChatReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [banOpen, setBanOpen] = useState(false);

  const copy = language === "am"
    ? {
        pending: "በመጠባበቅ ላይ",
        resolved: "የተፈቱ",
        dismissed: "የተዘጉ",
        empty: "በዚህ ሁኔታ ላይ ያለ Chat report የለም።",
        evidence: "የተጠበቀ ማስረጃ",
        reporter: "ሪፖርት ያደረገው Partner",
        reporterPrivate: "ለAdmin ብቻ · ለተሪፖርት የተደረገው ሰው አይታይም",
        replyContext: "የምላሽ አውድ",
        note: "የPartner ማስታወሻ",
        resolution: "የAdmin የግምገማ ማስታወሻ (አማራጭ)",
        dismiss: "ሪፖርቱን ዝጋ",
        resolve: "ተፈትቷል ብለህ ምልክት አድርግ",
        ban: "Partner እገድ",
        select: "ሙሉ ማስረጃውን ለማየት Chat report ይምረጡ።",
        admin: "Admin message",
      }
    : {
        pending: "Pending",
        resolved: "Resolved",
        dismissed: "Dismissed",
        empty: "There are no Chat reports in this state.",
        evidence: "Preserved evidence",
        reporter: "Reporting Partner",
        reporterPrivate: "Admin only · never disclosed to the reported user",
        replyContext: "Reply context",
        note: "Partner note",
        resolution: "Admin review note (optional)",
        dismiss: "Dismiss report",
        resolve: "Mark resolved",
        ban: "Ban Partner",
        select: "Select a Chat report to review the complete evidence.",
        admin: "Admin message",
      };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAdminChatReports(status, language);
      setReports(result);
      setSelected((current) => result.find((report) => report.id === current?.id) ?? result[0] ?? null);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load Chat reports.");
    } finally {
      setLoading(false);
    }
  }, [language, status]);

  useEffect(() => {
    let cancelled = false;

    void getAdminChatReports(status, language)
      .then((result) => {
        if (cancelled) return;
        setReports(result);
        setSelected((current) => result.find((report) => report.id === current?.id) ?? result[0] ?? null);
        setError("");
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load Chat reports.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [language, status]);

  async function review(nextStatus: "resolved" | "dismissed", actionSummary = "") {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await reviewAdminChatReport(selected.id, language, {
        status: nextStatus,
        resolutionNote: resolutionNote.trim() || undefined,
        actionSummary: actionSummary || undefined,
      });
      setResolutionNote("");
      await load();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Unable to review this Chat report.");
    } finally {
      setBusy(false);
    }
  }

  const tabs: Array<[AdminChatReportStatus, string]> = [
    ["pending", copy.pending],
    ["resolved", copy.resolved],
    ["dismissed", copy.dismissed],
  ];

  const reasonLabels: Record<string, string> = language === "am"
    ? { spam: "Spam", harassment: "ትንኮሳ", scam: "ማጭበርበር", inappropriate: "ተገቢ ያልሆነ", threats: "ዛቻ", other: "ሌላ" }
    : { spam: "Spam", harassment: "Harassment", scam: "Scam", inappropriate: "Inappropriate", threats: "Threats", other: "Other" };

  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-black/[0.06] bg-[linear-gradient(135deg,#fff,#f4f8f1)] p-5 shadow-[0_12px_40px_rgba(39,53,30,0.04)] sm:p-7">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600"><MessageSquareWarning className="h-5 w-5" /></span>
          <div>
            <span className="text-[9px] font-black tracking-[0.15em] text-[#638d46]">CHAT MODERATION</span>
            <p className="mt-1 text-[10px] leading-5 text-black/48">
              {language === "am" ? "የመልዕክት ማስረጃ፣ የግምገማ ውሳኔ እና የመለያ እርምጃ በአንድ ቦታ።" : "Message evidence, review decisions, and documented account action in one place."}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {tabs.map(([value, label]) => (
            <button key={value} type="button" onClick={() => { setLoading(true); setStatus(value); setResolutionNote(""); }} className={`h-9 rounded-xl px-4 text-[10px] font-extrabold ${status === value ? "bg-[#426c2b] text-white" : "border border-black/[0.07] bg-white text-black/50"}`}>{label}</button>
          ))}
        </div>
      </section>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[10px] text-red-650">{error}</p>}

      <div className="grid min-h-[560px] gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-[21px] border border-black/[0.06] bg-white">
          {loading ? (
            <div className="flex h-full min-h-[300px] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-[#426c2b]" /></div>
          ) : reports.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-8 text-center"><Flag className="h-6 w-6 text-black/25" /><p className="mt-3 text-[10px] leading-5 text-black/42">{copy.empty}</p></div>
          ) : (
            <div className="max-h-[720px] overflow-y-auto p-2">
              {reports.map((report) => (
                <button key={report.id} type="button" onClick={() => { setSelected(report); setResolutionNote(report.resolutionNote); }} className={`mb-1.5 w-full rounded-[15px] border p-3.5 text-left transition ${selected?.id === report.id ? "border-[#7da664]/25 bg-[#f1f7ed]" : "border-transparent hover:bg-black/[0.025]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#edf5e7] text-[10px] font-black text-[#426c2b]">
                        {report.reported.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={report.reported.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : initials(report.reported.name)}
                      </span>
                      <span className="min-w-0"><strong className="block truncate text-[10px] text-[#293127]">{report.reported.name}</strong><span className="mt-0.5 block truncate text-[8px] text-black/38">{report.reported.partnerId || copy.admin}</span></span>
                    </span>
                    <span className="rounded-full bg-red-50 px-2 py-1 text-[8px] font-extrabold text-red-650">{reasonLabels[report.reason]}</span>
                  </div>
                  <p className="mt-2.5 line-clamp-2 text-[9px] leading-4 text-black/48">{report.evidence.message}</p>
                  <time className="mt-2 block text-[8px] text-black/30">{formatDate(report.createdAt, language)}</time>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[21px] border border-black/[0.06] bg-white p-5 sm:p-6">
          {!selected ? (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center"><AlertTriangle className="h-7 w-7 text-black/20" /><p className="mt-3 max-w-[300px] text-[10px] leading-5 text-black/42">{copy.select}</p></div>
          ) : (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[15px] bg-[#edf5e7] text-[12px] font-black text-[#426c2b]">
                    {selected.reported.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selected.reported.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : initials(selected.reported.name)}
                  </span>
                  <div className="min-w-0">
                    <strong className="block truncate text-[15px] font-black text-[#242b21]">{selected.reported.name}</strong>
                    <span className="mt-1 block text-[9px] text-black/42">{selected.reported.partnerId || copy.admin}</span>
                    {selected.reported.performance && <div className="mt-2"><PartnerRankBadge rank={selected.reported.performance.rank} language={language} /></div>}
                  </div>
                </div>
                <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[8px] font-extrabold ${selected.status === "pending" ? "bg-amber-50 text-amber-700" : selected.status === "resolved" ? "bg-[#edf5e7] text-[#426c2b]" : "bg-black/[0.05] text-black/45"}`}>
                  {selected.status === "pending" ? <Clock3 className="h-3 w-3" /> : selected.status === "resolved" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {selected.status}
                </span>
              </div>

              {selected.reported.performance && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-[#f5f8f3] p-3"><span className="text-[8px] text-black/38">{language === "am" ? "የተረጋገጡ ሽያጮች" : "Verified sales"}</span><strong className="mt-1 block text-[16px] font-black text-[#426c2b]">{selected.reported.performance.verifiedSales}</strong></div>
                  <div className="rounded-xl bg-[#f5f8f3] p-3"><span className="text-[8px] text-black/38">{language === "am" ? "ሪፖርቶች" : "Reports"}</span><strong className="mt-1 block text-[16px] font-black text-[#426c2b]">{selected.reported.performance.reports}</strong></div>
                </div>
              )}

              <div className="mt-5 rounded-[16px] border border-red-100 bg-[#fffaf9] p-4">
                <div className="flex items-center justify-between gap-3"><span className="text-[9px] font-black uppercase tracking-[0.12em] text-red-600">{copy.evidence}</span><time className="text-[8px] text-black/35">{formatDate(selected.evidence.sentAt, language)}</time></div>
                <blockquote className="mt-3 whitespace-pre-wrap text-[12px] leading-6 text-[#343a31]">{selected.evidence.message}</blockquote>
                {selected.evidence.replyContext && <div className="mt-3 border-l-2 border-black/10 pl-3"><span className="block text-[8px] font-bold text-black/35">{copy.replyContext}</span><p className="mt-1 text-[9px] leading-4 text-black/45">{selected.evidence.replyContext}</p></div>}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[14px] bg-[#f6f8f4] p-3.5"><span className="text-[8px] font-black uppercase tracking-[0.1em] text-[#638d46]">{reasonLabels[selected.reason]}</span><p className="mt-2 text-[9px] leading-5 text-black/52">{selected.note || (language === "am" ? "ተጨማሪ ማስታወሻ የለም።" : "No additional note.")}</p></div>
                <div className="rounded-[14px] border border-[#dfe9da] p-3.5"><span className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.1em] text-[#638d46]"><EyeOff className="h-3 w-3" />{copy.reporter}</span><strong className="mt-2 block text-[10px] text-[#30372d]">{selected.reporter.name} · {selected.reporter.partnerId}</strong><p className="mt-1.5 text-[8px] leading-4 text-black/38">{copy.reporterPrivate}</p></div>
              </div>

              {selected.status === "pending" ? (
                <div className="mt-5 border-t border-black/[0.06] pt-5">
                  <label className="block"><span className="mb-2 block text-[9px] font-extrabold text-black/48">{copy.resolution}</span><textarea value={resolutionNote} onChange={(event) => setResolutionNote(event.target.value)} maxLength={1000} rows={3} className="w-full rounded-xl border border-black/10 bg-[#fafbf8] p-3 text-[10px] leading-5 outline-none focus:border-[#75a258]/40" /></label>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <button type="button" disabled={busy} onClick={() => void review("dismissed")} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-black/10 text-[9px] font-extrabold text-black/48 disabled:opacity-40"><XCircle className="h-3.5 w-3.5" />{copy.dismiss}</button>
                    {selected.reported.representativeId && <button type="button" disabled={busy} onClick={() => setBanOpen(true)} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-[9px] font-extrabold text-red-650 disabled:opacity-40"><Ban className="h-3.5 w-3.5" />{copy.ban}</button>}
                    <button type="button" disabled={busy} onClick={() => void review("resolved")} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#426c2b] text-[9px] font-extrabold text-white disabled:opacity-40">{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}{copy.resolve}</button>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-[14px] bg-[#f5f8f3] p-4"><span className="text-[8px] font-black uppercase tracking-[0.1em] text-[#638d46]">{language === "am" ? "የAdmin ውሳኔ" : "Admin decision"}</span><p className="mt-2 text-[10px] leading-5 text-black/52">{selected.resolutionNote || selected.actionSummary || (language === "am" ? "ማስታወሻ አልተጨመረም።" : "No review note was added.")}</p></div>
              )}
            </div>
          )}
        </section>
      </div>

      {selected?.reported.representativeId && (
        <BanPartnerDialog
          key={selected.id}
          open={banOpen}
          representativeId={selected.reported.representativeId}
          partnerName={selected.reported.name}
          language={language}
          sourceChatReportId={selected.id}
          suggestedReason={`Chat report (${reasonLabels[selected.reason]}): ${selected.note || selected.evidence.message.slice(0, 180)}`}
          onClose={() => setBanOpen(false)}
          onBanned={async (ban) => {
            await review(
              "resolved",
              ban.isPermanent
                ? "Partner permanently banned from this Chat report."
                : `Partner temporarily banned until ${ban.bannedUntil}.`,
            );
          }}
        />
      )}
    </div>
  );
}
