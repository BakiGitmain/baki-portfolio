"use client";

import { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Copy,
  Gift,
  Handshake,
  Link2,
  Send,
  Sparkles,
  Target,
  UserPlus,
  X,
} from "lucide-react";

import {
  submitRepresentativeProgramChallenge,
  type RepresentativeProgram,
} from "@/lib/representative-profile-api";

type Language = "en" | "am";
type Target = RepresentativeProgram["targets"][number];

const copy = {
  en: {
    challenge: "Challenge",
    yourGoal: "Your goal",
    progress: "Progress",
    deadline: "Deadline",
    reward: "Reward",
    instructions: "Instructions",
    automatic: "Automatically tracked",
    verification: "Admin verification required",
    referralVerification: "Counts after the applicant is accepted and activates their account",
    showDetails: "View details & history",
    hideDetails: "Hide details",
    submissionHistory: "Submission history",
    noSubmissions: "No submissions yet.",
    pending: "Pending Review",
    approved: "Approved",
    rejected: "Rejected",
    locked: "Locked",
    earned: "Earned — waiting for admin approval",
    rewardApproved: "Approved",
    paid: "Paid",
    applied: "Applied",
    submitCustomer: "Submit customer",
    submitLead: "Submit lead",
    submitSale: "Submit sale",
    submitProof: "Submit proof",
    shareReferral: "Copy referral link",
    copied: "Referral link copied",
    businessName: "Business name",
    contactName: "Contact person",
    contactMethod: "Phone / contact method",
    businessType: "Business type",
    need: "What they need",
    notes: "Short notes",
    explanation: "What did you complete?",
    publicUrl: "Public URL (optional)",
    submit: "Submit for review",
    recording: "Record lead",
    submitting: "Submitting...",
    cancel: "Cancel",
    submissionSent: "Submission sent successfully.",
    noPrograms: "No Programs assigned right now",
    noProgramsHelp: "New challenges and goals will appear here when they are assigned to you.",
    endsToday: "Ends today",
    ended: "Deadline passed",
    startsIn: (days: number) => `Starts in ${days} day${days === 1 ? "" : "s"}`,
    endsIn: (days: number) => `Ends in ${days} day${days === 1 ? "" : "s"}`,
    status: {
      upcoming: "Upcoming",
      active: "Active",
      completed: "Completed",
      expired: "Expired",
    },
  },
  am: {
    challenge: "ፈተና",
    yourGoal: "ግብዎ",
    progress: "እድገት",
    deadline: "የመጨረሻ ቀን",
    reward: "ሽልማት",
    instructions: "መመሪያ",
    automatic: "በራስ-ሰር ይከታተላል",
    verification: "የአስተዳዳሪ ማረጋገጫ ያስፈልጋል",
    referralVerification: "አመልካቹ ተቀባይነት አግኝቶ መለያውን ካነቃ በኋላ ይቆጠራል",
    showDetails: "ዝርዝር እና ታሪክ ይመልከቱ",
    hideDetails: "ዝርዝሩን ዝጋ",
    submissionHistory: "የቀረቡ መረጃዎች",
    noSubmissions: "እስካሁን የቀረበ መረጃ የለም።",
    pending: "ለምርመራ በመጠባበቅ ላይ",
    approved: "ጸድቋል",
    rejected: "ውድቅ ተደርጓል",
    locked: "ተቆልፏል",
    earned: "ተገኝቷል — የአስተዳዳሪ ፈቃድ በመጠበቅ ላይ",
    rewardApproved: "ጸድቋል",
    paid: "ተከፍሏል",
    applied: "ተተግብሯል",
    submitCustomer: "ደንበኛ አስገባ",
    submitLead: "ፍላጎት ያለውን ደንበኛ አስገባ",
    submitSale: "ሽያጭ አስገባ",
    submitProof: "ማስረጃ አስገባ",
    shareReferral: "የጥቆማ ሊንኩን ቅዳ",
    copied: "የጥቆማ ሊንኩ ተቀድቷል",
    businessName: "የንግድ ስም",
    contactName: "የሚገናኙት ሰው",
    contactMethod: "ስልክ / የመገናኛ መንገድ",
    businessType: "የንግድ ዓይነት",
    need: "ምን ያስፈልጋቸዋል?",
    notes: "አጭር ማስታወሻ",
    explanation: "ምን አጠናቀዋል?",
    publicUrl: "ይፋዊ ሊንክ (ካለ)",
    submit: "ለምርመራ ላክ",
    recording: "መረጃውን መዝግብ",
    submitting: "በመላክ ላይ...",
    cancel: "ይቅር",
    submissionSent: "መረጃው በተሳካ ሁኔታ ተልኳል።",
    noPrograms: "በአሁኑ ጊዜ የተመደበ ፕሮግራም የለም",
    noProgramsHelp: "አዲስ ፈተናዎችና ግቦች ሲመደቡልዎት እዚህ ይታያሉ።",
    endsToday: "ዛሬ ያበቃል",
    ended: "የመጨረሻ ቀኑ አልፏል",
    startsIn: (days: number) => `በ${days} ቀን ይጀምራል`,
    endsIn: (days: number) => `በ${days} ቀን ያበቃል`,
    status: {
      upcoming: "በቅርቡ",
      active: "ንቁ",
      completed: "ተጠናቋል",
      expired: "ጊዜው አልፏል",
    },
  },
} as const;

function deadline(program: RepresentativeProgram, language: Language) {
  const text = copy[language];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(`${program.endDate}T00:00:00`);
  const start = new Date(`${program.startDate}T00:00:00`);
  const day = 86_400_000;
  if (start.getTime() > today.getTime()) return text.startsIn(Math.ceil((start.getTime() - today.getTime()) / day));
  const days = Math.ceil((end.getTime() - today.getTime()) / day);
  if (days < 0) return text.ended;
  if (days === 0) return text.endsToday;
  return text.endsIn(days);
}

function targetLabel(target: Target, language: Language) {
  const am = language === "am";
  if (target.targetType === "reports") return am ? "ሪፖርቶችን ማስገባት" : "Reports submitted";
  if (target.targetType === "lessons") return am ? "ትምህርቶችን ማጠናቀቅ" : "Lessons completed";
  if (target.targetType === "course_completion") return am ? target.courseTitleAm || "ኮርስ ማጠናቀቅ" : target.courseTitleEn || "Course completed";
  if (target.targetType === "leads_submitted") return am ? "ፍላጎት ያላቸውን ደንበኞች ማስገባት" : "Leads submitted";
  if (target.targetType === "qualified_lead") return am ? "ብቁ ደንበኛ ማግኘት" : "Qualified lead";
  if (target.targetType === "confirmed_sale") return am ? "የተረጋገጠ ሽያጭ" : "Confirmed sale";
  if (target.targetType === "partner_referral") return am ? "አዲስ ንቁ የሽያጭ አጋር መጋበዝ" : "Accepted & activated partner referral";
  return am ? "የተረጋገጠ ልዩ ፈተና" : "Custom verified challenge";
}

function rewardLabel(program: RepresentativeProgram, language: Language) {
  const reward = program.reward;
  if (reward.type === "bonus_commission") {
    const scope = reward.scope === "challenge_sale"
      ? language === "am" ? "በዚህ ፈተና ሽያጭ ላይ" : "on the challenge-related sale"
      : language === "am" ? "በሚቀጥለው ብቁ ሽያጭ ላይ" : "on your next qualifying sale";
    return `+${reward.value ?? 0} ${language === "am" ? "የኮሚሽን መቶኛ ነጥቦች" : "percentage points commission"} ${scope}`;
  }
  if (reward.type === "fixed_etb") return `ETB ${(reward.value ?? 0).toLocaleString()} ${language === "am" ? "ቦነስ" : "bonus"}`;
  return reward.description || (language === "am" ? "እውቅና" : "Recognition");
}

function rewardStatus(program: RepresentativeProgram, language: Language) {
  const text = copy[language];
  if (program.reward.status === "earned") return text.earned;
  if (program.reward.status === "approved") return text.rewardApproved;
  if (program.reward.status === "paid") return text.paid;
  if (program.reward.status === "applied") return text.applied;
  return text.locked;
}

function TargetIcon({ type }: { type: Target["targetType"] }) {
  if (type === "partner_referral") return <UserPlus className="h-5 w-5" />;
  if (type === "confirmed_sale") return <Handshake className="h-5 w-5" />;
  if (type === "custom_challenge") return <Sparkles className="h-5 w-5" />;
  if (type === "qualified_lead" || type === "leads_submitted") return <BriefcaseBusiness className="h-5 w-5" />;
  return <Target className="h-5 w-5" />;
}

export default function RepresentativePrograms({
  programs,
  language,
  onRefresh,
}: {
  programs: RepresentativeProgram[];
  language: Language;
  onRefresh: () => Promise<void> | void;
}) {
  const text = copy[language];
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [submissionTarget, setSubmissionTarget] = useState<{ program: RepresentativeProgram; target: Target } | null>(null);
  const [form, setForm] = useState({ businessName: "", contactName: "", contactMethod: "", businessType: "", needSummary: "", notes: "", explanation: "", publicUrl: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const sortedPrograms = useMemo(
    () => [...programs].sort((a, b) => {
      const order = { active: 0, upcoming: 1, completed: 2, expired: 3 };
      return order[a.effectiveStatus] - order[b.effectiveStatus] || a.endDate.localeCompare(b.endDate);
    }),
    [programs],
  );

  function toggleExpanded(programId: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(programId)) next.delete(programId);
      else next.add(programId);
      return next;
    });
  }

  async function copyReferral(program: RepresentativeProgram) {
    const link = `${window.location.origin}${program.referralPath}`;
    await navigator.clipboard.writeText(link);
    setSuccess(text.copied);
    window.setTimeout(() => setSuccess(""), 3000);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!submissionTarget) return;
    setSubmitting(true);
    setError("");
    try {
      await submitRepresentativeProgramChallenge(submissionTarget.program.id, submissionTarget.target.id, form);
      setSubmissionTarget(null);
      setForm({ businessName: "", contactName: "", contactMethod: "", businessType: "", needSummary: "", notes: "", explanation: "", publicUrl: "" });
      setSuccess(text.submissionSent);
      await onRefresh();
      window.setTimeout(() => setSuccess(""), 4000);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit this challenge.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!sortedPrograms.length) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-6 text-center">
        <span className="flex h-13 w-13 items-center justify-center rounded-[17px] bg-[var(--portal-green-soft)] text-[var(--portal-green)]"><Target className="h-6 w-6" /></span>
        <h2 className="mt-4 text-[15px] font-black">{text.noPrograms}</h2>
        <p className="mt-2 max-w-sm text-[10px] leading-5 text-[var(--portal-muted)]">{text.noProgramsHelp}</p>
      </div>
    );
  }

  return (
    <>
      {success && <div className="mb-4 flex items-center gap-2 rounded-[15px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[10px] font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> {success}</div>}
      <div className="grid gap-5 xl:grid-cols-2">
        {sortedPrograms.map((program) => {
          const isExpanded = expanded.has(program.id);
          const primary = program.targets[0];
          return (
            <article key={program.id} className="overflow-hidden rounded-[25px] border border-[var(--portal-border)] bg-[var(--portal-surface)] shadow-[0_12px_40px_var(--portal-shadow)]">
              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-[var(--portal-green-soft)] text-[var(--portal-green)]">
                    {primary ? <TargetIcon type={primary.targetType} /> : <Target className="h-5 w-5" />}
                  </span>
                  <span className={`rounded-full px-3 py-1.5 text-[9px] font-black ${program.effectiveStatus === "expired" ? "bg-red-50 text-red-600" : program.effectiveStatus === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-[var(--portal-green-soft)] text-[var(--portal-green)]"}`}>
                    {text.status[program.effectiveStatus]}
                  </span>
                </div>

                <span className="mt-5 block text-[8px] font-black uppercase tracking-[0.15em] text-[var(--portal-green)]">{text.challenge}</span>
                <h2 className="mt-1.5 text-[20px] font-black tracking-[-0.04em]">{program.title}</h2>
                <p className="mt-2 text-[11px] leading-6 text-[var(--portal-muted)]">{program.description}</p>

                <div className="mt-5 flex items-end justify-between gap-4">
                  <div><span className="text-[8px] font-black uppercase tracking-[0.12em] text-[var(--portal-faint)]">{text.progress}</span><strong className="mt-1 block text-[28px] font-black tracking-[-0.05em] text-[var(--portal-green)]">{program.progressPercent}%</strong></div>
                  <span className="flex items-center gap-1.5 text-[9px] font-bold text-[var(--portal-muted)]"><CalendarDays className="h-3.5 w-3.5" /> {deadline(program, language)}</span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--portal-border)]"><div className="h-full rounded-full bg-[var(--portal-green)] transition-all duration-500" style={{ width: `${program.progressPercent}%` }} /></div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[17px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] p-4">
                    <span className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.1em] text-[var(--portal-faint)]"><Target className="h-3.5 w-3.5" /> {text.yourGoal}</span>
                    <strong className="mt-2 block text-[11px] leading-5">{primary ? `${primary.targetValue} × ${targetLabel(primary, language)}` : "—"}</strong>
                  </div>
                  <div className="rounded-[17px] border border-[#e8d9b6] bg-[#fffaf0] p-4 text-[#4f4020]">
                    <span className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.1em] text-[#9a6b14]"><Gift className="h-3.5 w-3.5" /> {text.reward}</span>
                    <strong title={program.reward.type === "bonus_commission" ? "A 20% base rate plus 5 percentage points becomes 25%, not 21%." : undefined} className="mt-2 block cursor-help text-[10px] leading-5">{rewardLabel(program, language)}</strong>
                    <span className="mt-1.5 block text-[8px] font-bold text-[#8b6d2f]">{rewardStatus(program, language)}</span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {program.targets.map((target) => {
                    const percent = Math.min(100, Math.round((100 * target.actualValue) / Math.max(1, target.targetValue)));
                    return (
                      <div key={target.id} className="rounded-[15px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] p-3.5">
                        <div className="flex items-center justify-between gap-3"><strong className="text-[10px]">{targetLabel(target, language)}</strong><span className="text-[10px] font-black text-[var(--portal-green)]">{target.actualValue} / {target.targetValue}</span></div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--portal-border)]"><div className="h-full rounded-full bg-[var(--portal-green)]" style={{ width: `${percent}%` }} /></div>
                        <span className="mt-2 block text-[8px] text-[var(--portal-muted)]">
                          {["reports", "lessons", "course_completion", "leads_submitted"].includes(target.targetType)
                            ? text.automatic
                            : target.targetType === "partner_referral"
                              ? text.referralVerification
                              : text.verification}
                        </span>
                        {program.effectiveStatus === "active" && target.actualValue < target.targetValue && (
                          <div className="mt-3">
                            {target.targetType === "partner_referral" ? (
                              <button type="button" onClick={() => void copyReferral(program)} className="flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[var(--portal-green)] text-[9px] font-bold text-white"><Copy className="h-3.5 w-3.5" /> {text.shareReferral}</button>
                            ) : ["leads_submitted", "qualified_lead", "confirmed_sale", "custom_challenge"].includes(target.targetType) ? (
                              <button type="button" onClick={() => setSubmissionTarget({ program, target })} className="flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[var(--portal-green)] text-[9px] font-bold text-white"><Send className="h-3.5 w-3.5" /> {target.targetType === "leads_submitted" ? text.submitLead : target.targetType === "qualified_lead" ? text.submitCustomer : target.targetType === "confirmed_sale" ? text.submitSale : text.submitProof}</button>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button type="button" onClick={() => toggleExpanded(program.id)} className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-2)] text-[9px] font-bold text-[var(--portal-muted)]">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {isExpanded ? text.hideDetails : text.showDetails}
                </button>
              </div>

              {isExpanded && (
                <div className="border-t border-[var(--portal-border)] bg-[var(--portal-surface-2)] p-5 sm:p-6">
                  {program.instructions && <div><span className="text-[8px] font-black uppercase tracking-[0.12em] text-[var(--portal-faint)]">{text.instructions}</span><p className="mt-2 whitespace-pre-wrap text-[10px] leading-6 text-[var(--portal-muted)]">{program.instructions}</p></div>}
                  <div className={program.instructions ? "mt-5" : ""}>
                    <span className="text-[8px] font-black uppercase tracking-[0.12em] text-[var(--portal-faint)]">{text.submissionHistory}</span>
                    <div className="mt-3 space-y-2">
                      {program.submissions.map((submission) => (
                        <div key={submission.id} className="rounded-[14px] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-3.5">
                          <div className="flex items-start justify-between gap-3"><strong className="text-[10px]">{submission.businessName || submission.explanation || targetLabel(program.targets.find((target) => target.id === submission.targetId) ?? program.targets[0]!, language)}</strong><span className={`rounded-full px-2 py-1 text-[8px] font-black ${submission.status === "approved" ? "bg-emerald-50 text-emerald-700" : submission.status === "rejected" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>{submission.status === "approved" ? text.approved : submission.status === "rejected" ? text.rejected : text.pending}</span></div>
                          {submission.rejectionReason && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-[9px] leading-5 text-red-600">{submission.rejectionReason}</p>}
                        </div>
                      ))}
                      {!program.submissions.length && <p className="rounded-[14px] border border-dashed border-[var(--portal-border)] px-4 py-6 text-center text-[9px] text-[var(--portal-muted)]">{text.noSubmissions}</p>}
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {submissionTarget && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <button type="button" aria-label="Close submission" onClick={() => setSubmissionTarget(null)} className="absolute inset-0" />
          <form onSubmit={submit} className="relative z-10 max-h-[92vh] w-full max-w-[570px] overflow-y-auto rounded-[25px] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5 text-[var(--portal-text)] shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4"><div><span className="text-[8px] font-black uppercase tracking-[0.13em] text-[var(--portal-green)]">{submissionTarget.program.title}</span><h3 className="mt-1.5 text-[20px] font-black tracking-[-0.04em]">{targetLabel(submissionTarget.target, language)}</h3></div><button type="button" onClick={() => setSubmissionTarget(null)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--portal-surface-2)] text-[var(--portal-muted)]"><X className="h-4 w-4" /></button></div>
            {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-[9px] leading-5 text-red-600">{error}</div>}

            {submissionTarget.target.targetType === "custom_challenge" ? (
              <div className="mt-5 space-y-3"><label><span className="mb-2 block text-[9px] font-bold text-[var(--portal-muted)]">{text.explanation}</span><textarea required rows={5} value={form.explanation} onChange={(event) => setForm((current) => ({ ...current, explanation: event.target.value }))} className="w-full rounded-[14px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] p-3 text-[11px] leading-6 outline-none" /></label><label><span className="mb-2 block text-[9px] font-bold text-[var(--portal-muted)]">{text.publicUrl}</span><div className="relative"><Link2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--portal-faint)]" /><input type="url" value={form.publicUrl} onChange={(event) => setForm((current) => ({ ...current, publicUrl: event.target.value }))} className="h-11 w-full rounded-[14px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] pl-10 pr-3 text-[10px] outline-none" /></div></label></div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[{ key: "businessName", label: text.businessName, required: true }, { key: "contactName", label: text.contactName, required: false }, { key: "contactMethod", label: text.contactMethod, required: true }, { key: "businessType", label: text.businessType, required: false }, { key: "needSummary", label: text.need, required: true }].map((field) => (
                  <label key={field.key} className={field.key === "needSummary" ? "sm:col-span-2" : ""}><span className="mb-2 block text-[9px] font-bold text-[var(--portal-muted)]">{field.label}</span><input required={field.required} value={form[field.key as keyof typeof form]} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} className="h-11 w-full rounded-[14px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-3 text-[10px] outline-none" /></label>
                ))}
                <label className="sm:col-span-2"><span className="mb-2 block text-[9px] font-bold text-[var(--portal-muted)]">{text.notes}</span><textarea rows={3} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="w-full rounded-[14px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] p-3 text-[10px] leading-5 outline-none" /></label>
              </div>
            )}

            {submissionTarget.target.targetType !== "leads_submitted" && <p className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--portal-green-soft)] px-3 py-3 text-[9px] leading-5 text-[var(--portal-green)]"><Clock3 className="h-4 w-4 shrink-0" /> {text.verification}</p>}
            <div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={() => setSubmissionTarget(null)} className="h-11 rounded-xl border border-[var(--portal-border)] text-[9px] font-bold">{text.cancel}</button><button type="submit" disabled={submitting} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--portal-green)] text-[9px] font-bold text-white disabled:opacity-50"><Send className="h-3.5 w-3.5" /> {submitting ? text.submitting : submissionTarget.target.targetType === "leads_submitted" ? text.recording : text.submit}</button></div>
          </form>
        </div>
      )}
    </>
  );
}
