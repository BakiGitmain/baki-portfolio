"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock3,
  Gift,
  Pencil,
  Target,
  Trash2,
  Users,
  X,
} from "lucide-react";

import AdminProgramEditor from "@/components/admin/admin-program-editor";
import ConfirmDestructiveDialog from "@/components/admin/confirm-destructive-dialog";
import { useLanguage } from "@/components/providers/language-provider";
import {
  deleteAdminProgram,
  getAdminProgram,
  getAdminProgramOptions,
  reviewAdminProgramSubmission,
  updateAdminProgram,
  updateAdminProgramReward,
  type PartnerProgramDetail,
  type PartnerProgramInput,
  type PartnerProgramOptions,
  type PartnerProgramSubmission,
} from "@/lib/admin-programs-api";

const emptyOptions: PartnerProgramOptions = { representatives: [], courses: [] };

function targetLabel(type: string, course?: string | null) {
  if (type === "reports") return "Reports submitted";
  if (type === "lessons") return "Lessons completed";
  if (type === "course_completion") return course ? `Complete ${course}` : "Course completed";
  if (type === "leads_submitted") return "Leads submitted";
  if (type === "qualified_lead") return "Qualified lead";
  if (type === "confirmed_sale") return "Confirmed sale";
  if (type === "partner_referral") return "Accepted & activated partner referral";
  return "Custom verified challenge";
}

function statusClass(status: string) {
  if (status === "approved" || status === "completed" || status === "applied" || status === "paid") {
    return "bg-[#edf5e7] text-[#426c2b]";
  }
  if (status === "rejected" || status === "expired") return "bg-red-50 text-red-600";
  if (status === "pending" || status === "earned") return "bg-amber-50 text-amber-700";
  return "bg-blue-50 text-blue-700";
}

function rewardLabel(reward: PartnerProgramDetail["reward"]) {
  if (reward.type === "bonus_commission") return `+${reward.value ?? 0} percentage points commission`;
  if (reward.type === "fixed_etb") return `ETB ${(reward.value ?? 0).toLocaleString()} bonus`;
  return reward.description || "Recognition only";
}

export default function AdminProgramDetail({ programId }: { programId: string }) {
  const router = useRouter();
  const { language } = useLanguage();
  const [program, setProgram] = useState<PartnerProgramDetail | null>(null);
  const [options, setOptions] = useState<PartnerProgramOptions>(emptyOptions);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [reviewing, setReviewing] = useState<PartnerProgramSubmission | null>(null);
  const [reviewMode, setReviewMode] = useState<"approve" | "reject">("approve");
  const [rejectionReason, setRejectionReason] = useState("");
  const [saleReference, setSaleReference] = useState("");
  const [saleAmount, setSaleAmount] = useState("");
  const [saleConfirmed, setSaleConfirmed] = useState(false);
  const [paymentCleared, setPaymentCleared] = useState(false);
  const [applyingRewardId, setApplyingRewardId] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const deleteCopy = language === "am"
    ? {
        label: "Program ሰርዝ",
        title: "ይህን Program ይሰርዙ?",
        description: "Programው ከAdmin እና Partner Portal ይወገዳል። አስቀድሞ የተመዘገቡ ማቅረቢያዎች፣ ሽልማቶች እና የኦዲት ታሪክ በደህና ይቀመጣሉ። ይህ እርምጃ ከዚህ ማያ መመለስ አይቻልም።",
        cancel: "ይቅር",
      }
    : {
        label: "Delete Program",
        title: "Delete this Program?",
        description: "The Program will disappear from Admin and Partner Portal. Existing submissions, rewards, and audit history will be retained safely. This action cannot be undone from this screen.",
        cancel: "Cancel",
      };

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getAdminProgram(programId), getAdminProgramOptions()])
      .then(([programResult, optionsResult]) => {
        if (cancelled) return;
        setProgram(programResult);
        setOptions(optionsResult);
        setError("");
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load this Program.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [programId]);

  async function refresh() {
    try {
      setProgram(await getAdminProgram(programId));
      setError("");
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unable to refresh this Program.");
    }
  }

  async function save(input: PartnerProgramInput) {
    setSaving(true);
    try {
      setProgram(await updateAdminProgram(programId, input));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function removeProgram() {
    setBusyId("delete");
    try {
      await deleteAdminProgram(programId);
      router.push("/admin/programs");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete the Program.");
      setBusyId("");
      setConfirmingDelete(false);
    }
  }

  async function submitReview() {
    if (!reviewing) return;
    setBusyId(reviewing.id);
    try {
      await reviewAdminProgramSubmission(reviewing.id, {
        decision: reviewMode,
        rejectionReason: reviewMode === "reject" ? rejectionReason : undefined,
        saleReference: reviewMode === "approve" && reviewing.submissionType === "confirmed_sale" ? saleReference : undefined,
        saleAmountEtb: reviewMode === "approve" && reviewing.submissionType === "confirmed_sale" ? Number(saleAmount) : undefined,
        saleConfirmed: reviewMode === "approve" && reviewing.submissionType === "confirmed_sale" ? saleConfirmed : undefined,
        customerPaymentCleared: reviewMode === "approve" && reviewing.submissionType === "confirmed_sale" ? paymentCleared : undefined,
      });
      setReviewing(null);
      setRejectionReason("");
      setSaleReference("");
      setSaleAmount("");
      setSaleConfirmed(false);
      setPaymentCleared(false);
      await refresh();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Unable to review the submission.");
    } finally {
      setBusyId("");
    }
  }

  async function rewardAction(
    rewardId: string,
    action: "approve" | "mark_paid" | "mark_applied",
  ) {
    setBusyId(rewardId);
    try {
      await updateAdminProgramReward(rewardId, {
        action,
        saleReference: action === "mark_applied" ? saleReference : undefined,
        saleAmountEtb: action === "mark_applied" && saleAmount ? Number(saleAmount) : undefined,
      });
      setApplyingRewardId(null);
      setSaleReference("");
      setSaleAmount("");
      await refresh();
    } catch (rewardError) {
      setError(rewardError instanceof Error ? rewardError.message : "Unable to update the reward.");
    } finally {
      setBusyId("");
    }
  }

  if (loading) {
    return <div className="flex min-h-[480px] items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-2 border-black/10 border-t-[#426c2b]" /></div>;
  }
  if (!program) {
    return <div className="rounded-[22px] border border-red-200 bg-red-50 p-6 text-[12px] text-red-700">{error || "Program not found."}</div>;
  }

  const pendingSubmissions = program.submissions.filter((submission) => submission.status === "pending");

  return (
    <div className="space-y-5">
      <Link href="/admin/programs" className="inline-flex items-center gap-2 text-[11px] font-bold text-[#527b3a]">
        <ArrowLeft className="h-4 w-4" /> All Programs
      </Link>

      <section className="rounded-[26px] border border-black/[0.06] bg-[linear-gradient(135deg,#ffffff,#f1f7ec)] p-6 shadow-[0_12px_40px_rgba(39,53,30,0.04)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold capitalize ${statusClass(program.effectiveStatus)}`}>
                {program.effectiveStatus}
              </span>
              {program.attentionCount > 0 && (
                <span className="rounded-full bg-[#c74f3d] px-2.5 py-1 text-[9px] font-extrabold text-white">
                  {program.attentionCount} need attention
                </span>
              )}
            </div>
            <h2 className="mt-3 text-[30px] font-black tracking-[-0.055em] text-[#171b15] sm:text-[38px]">{program.title}</h2>
            <p className="mt-3 text-[12px] leading-6 text-black/55">{program.description}</p>
            {program.instructions && <p className="mt-3 rounded-xl bg-white/70 px-4 py-3 text-[10px] leading-5 text-black/48">{program.instructions}</p>}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditing(true)} className="flex h-10 items-center gap-2 rounded-xl border border-black/[0.07] bg-white px-4 text-[10px] font-bold text-[#35412f]"><Pencil className="h-4 w-4" /> Edit</button>
            <button type="button" disabled={busyId === "delete"} onClick={() => setConfirmingDelete(true)} className="flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-[10px] font-bold text-red-600 disabled:opacity-45"><Trash2 className="h-4 w-4" /> {deleteCopy.label}</button>
          </div>
        </div>
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[11px] text-red-700">{error}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Overall progress", value: `${program.progressPercent}%`, icon: <Target className="h-5 w-5" /> },
          { label: "Partners assigned", value: program.participantCount, icon: <Users className="h-5 w-5" /> },
          { label: "Completed", value: program.completedCount, icon: <BadgeCheck className="h-5 w-5" /> },
          { label: "Waiting review", value: program.pendingSubmissionCount, icon: <Clock3 className="h-5 w-5" /> },
          { label: "Rewards waiting", value: program.pendingRewardCount, icon: <Gift className="h-5 w-5" /> },
        ].map((item) => (
          <article key={item.label} className="rounded-[20px] border border-black/[0.06] bg-white p-5 shadow-[0_8px_28px_rgba(37,50,29,0.035)]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5e7] text-[#426c2b]">{item.icon}</span>
            <strong className="mt-4 block text-[18px] font-black text-[#22291f]">{item.value}</strong>
            <span className="mt-1 block text-[10px] text-black/48">{item.label}</span>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <article className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-[0_10px_34px_rgba(37,50,29,0.035)] sm:p-6">
          <span className="text-[10px] font-extrabold tracking-[0.14em] text-[#628d46]">CHALLENGE</span>
          <h3 className="mt-1.5 text-[19px] font-black tracking-[-0.03em] text-[#22291f]">What partners need to finish</h3>
          <div className="mt-4 space-y-3">
            {program.targets.map((target) => (
              <div key={target.id} className="rounded-2xl border border-black/[0.055] bg-[#fafbf8] p-4">
                <strong className="block text-[11px] text-[#293027]">{targetLabel(target.targetType, target.courseTitleEn)}</strong>
                <span className="mt-1 block text-[10px] text-black/48">Target: {target.targetValue}</span>
                <span className="mt-2 block text-[9px] font-bold text-[#527b3a]">
                  {["reports", "lessons", "course_completion", "leads_submitted"].includes(target.targetType)
                    ? "Automatically tracked"
                    : target.targetType === "partner_referral"
                      ? "Counts after acceptance and account activation"
                      : "Admin verification required"}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-[#ecd9ac] bg-[#fff9ec] p-4">
            <span className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#9a6b14]"><Gift className="h-4 w-4" /> Reward</span>
            <strong className="mt-2 block text-[12px] text-[#4c3c1c]">{rewardLabel(program.reward)}</strong>
            {program.reward.type === "bonus_commission" && (
              <p className="mt-2 text-[9px] leading-5 text-[#725a2b]">Percentage points are added to the normal rate. 20% + 5 points = 25%, not 21%.</p>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#f7f9f4] px-3 py-3 text-[9px] text-black/48">
            <CalendarDays className="h-4 w-4 text-[#628d46]" /> {program.startDate} → {program.endDate}
          </div>
        </article>

        <article className="overflow-hidden rounded-[22px] border border-black/[0.06] bg-white shadow-[0_10px_34px_rgba(37,50,29,0.035)]">
          <div className="p-5 sm:p-6">
            <span className="text-[10px] font-extrabold tracking-[0.14em] text-[#628d46]">PARTNERS</span>
            <h3 className="mt-1.5 text-[19px] font-black tracking-[-0.03em] text-[#22291f]">Progress by partner</h3>
          </div>
          <div className="max-h-[430px] overflow-auto border-t border-black/[0.055]">
            {program.ranking.map((participant) => (
              <div key={participant.representativeId} className="flex items-center gap-4 border-b border-black/[0.05] px-5 py-4 last:border-b-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf5e7] text-[10px] font-black text-[#426c2b]">{participant.name.slice(0, 1).toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-3">
                    <span><strong className="block truncate text-[11px] text-[#293027]">{participant.name}</strong><span className="text-[9px] text-black/43">{participant.partnerId}</span></span>
                    <strong className="text-[11px] text-[#426c2b]">{participant.progressPercent}%</strong>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/[0.06]"><div className="h-full rounded-full bg-[#70a650]" style={{ width: `${participant.progressPercent}%` }} /></div>
                </div>
              </div>
            ))}
            {!program.ranking.length && <p className="px-5 py-10 text-center text-[11px] text-black/45">No eligible partners are assigned.</p>}
          </div>
        </article>
      </section>

      <section className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-[0_10px_34px_rgba(37,50,29,0.035)] sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold tracking-[0.14em] text-[#628d46]">SUBMISSIONS</span>
            <h3 className="mt-1.5 text-[19px] font-black tracking-[-0.03em] text-[#22291f]">Challenge review</h3>
          </div>
          {pendingSubmissions.length > 0 && <span className="rounded-full bg-[#c74f3d] px-3 py-1.5 text-[9px] font-extrabold text-white">{pendingSubmissions.length} waiting</span>}
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {program.submissions.map((submission) => (
            <article key={submission.id} className="rounded-[18px] border border-black/[0.06] bg-[#fafbf8] p-4">
              <div className="flex items-start justify-between gap-3">
                <span><strong className="block text-[11px] text-[#263022]">{submission.representativeName}</strong><span className="text-[9px] text-black/43">{submission.partnerId} · {targetLabel(submission.submissionType)}</span></span>
                <span className={`rounded-full px-2 py-1 text-[8px] font-extrabold capitalize ${statusClass(submission.status)}`}>{submission.status === "pending" ? "Pending Review" : submission.status}</span>
              </div>
              <div className="mt-3 space-y-1.5 text-[9px] leading-5 text-black/52">
                {submission.businessName && <p><strong className="text-black/65">Business:</strong> {submission.businessName}</p>}
                {submission.contactName && <p><strong className="text-black/65">Contact:</strong> {submission.contactName}</p>}
                {submission.contactMethod && <p><strong className="text-black/65">Method:</strong> {submission.contactMethod}</p>}
                {submission.needSummary && <p><strong className="text-black/65">Need:</strong> {submission.needSummary}</p>}
                {submission.explanation && <p><strong className="text-black/65">Proof:</strong> {submission.explanation}</p>}
                {submission.notes && <p><strong className="text-black/65">Notes:</strong> {submission.notes}</p>}
                {submission.publicUrl && <a href={submission.publicUrl} target="_blank" rel="noreferrer" className="font-bold text-[#527b3a] underline">Open submitted link</a>}
                {submission.rejectionReason && <p className="rounded-xl bg-red-50 px-3 py-2 text-red-600"><strong>Reason:</strong> {submission.rejectionReason}</p>}
              </div>
              {submission.status === "pending" && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => { setReviewing(submission); setReviewMode("reject"); }} className="h-9 rounded-xl border border-red-200 bg-red-50 text-[9px] font-bold text-red-650">Reject</button>
                  <button type="button" onClick={() => { setReviewing(submission); setReviewMode("approve"); }} className="h-9 rounded-xl bg-[#426c2b] text-[9px] font-bold text-white">Approve</button>
                </div>
              )}
            </article>
          ))}
          {!program.submissions.length && <div className="col-span-full rounded-[18px] border border-dashed border-black/10 px-5 py-10 text-center text-[11px] text-black/45">No challenge submissions yet.</div>}
        </div>
      </section>

      <section className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-[0_10px_34px_rgba(37,50,29,0.035)] sm:p-6">
        <span className="text-[10px] font-extrabold tracking-[0.14em] text-[#628d46]">REWARDS</span>
        <h3 className="mt-1.5 text-[19px] font-black tracking-[-0.03em] text-[#22291f]">Manual approval & payout/application</h3>
        <p className="mt-1 text-[10px] leading-5 text-black/48">The system tracks rewards. It never sends money or permanently changes a partner&apos;s base commission.</p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {program.rewards.map((reward) => (
            <article key={reward.id ?? reward.representativeId} className="rounded-[18px] border border-black/[0.06] bg-[#fafbf8] p-4">
              <div className="flex items-start justify-between gap-3">
                <span><strong className="block text-[11px] text-[#263022]">{reward.representativeName}</strong><span className="text-[9px] text-black/43">{reward.partnerId}</span></span>
                <span className={`rounded-full px-2 py-1 text-[8px] font-extrabold capitalize ${statusClass(reward.status)}`}>{reward.status}</span>
              </div>
              <strong className="mt-3 block text-[12px] text-[#4c3c1c]">{rewardLabel(reward)}</strong>
              {reward.effectiveCommissionPercent !== null && (
                <p className="mt-2 text-[9px] text-[#527b3a]">{reward.baseCommissionPercent}% base + {reward.value} points = <strong>{reward.effectiveCommissionPercent}%</strong> on {reward.saleReference}</p>
              )}
              {reward.status === "earned" && reward.id && (
                <button type="button" disabled={busyId === reward.id} onClick={() => void rewardAction(reward.id!, "approve")} className="mt-4 h-9 w-full rounded-xl bg-[#426c2b] text-[9px] font-bold text-white disabled:opacity-50">Approve reward</button>
              )}
              {reward.status === "approved" && reward.id && reward.type === "fixed_etb" && (
                <button type="button" disabled={busyId === reward.id} onClick={() => void rewardAction(reward.id!, "mark_paid")} className="mt-4 h-9 w-full rounded-xl bg-[#426c2b] text-[9px] font-bold text-white disabled:opacity-50">Mark Paid</button>
              )}
              {reward.status === "approved" && reward.id && reward.type === "none" && (
                <button type="button" disabled={busyId === reward.id} onClick={() => void rewardAction(reward.id!, "mark_applied")} className="mt-4 h-9 w-full rounded-xl bg-[#426c2b] text-[9px] font-bold text-white disabled:opacity-50">Mark Applied</button>
              )}
              {reward.status === "approved" && reward.id && reward.type === "bonus_commission" && (
                <button type="button" onClick={() => setApplyingRewardId(reward.id)} className="mt-4 h-9 w-full rounded-xl bg-[#426c2b] text-[9px] font-bold text-white">Apply to qualifying sale</button>
              )}
            </article>
          ))}
          {!program.rewards.length && <div className="col-span-full rounded-[18px] border border-dashed border-black/10 px-5 py-10 text-center text-[11px] text-black/45">Rewards appear here when partners complete every goal.</div>}
        </div>
      </section>

      {editing && (
        <div className="fixed inset-0 z-[130] flex justify-end bg-black/35 backdrop-blur-[3px]">
          <button type="button" aria-label="Close Program editor" onClick={() => setEditing(false)} className="absolute inset-0" />
          <div className="relative z-10 h-full w-full max-w-[760px] overflow-y-auto bg-[#f7f9f4] p-5 shadow-[-25px_0_80px_rgba(30,42,24,0.16)] sm:p-7">
            <div className="mb-5 flex items-center justify-between"><div><span className="text-[10px] font-extrabold tracking-[0.14em] text-[#628d46]">EDIT PROGRAM</span><h2 className="mt-1 text-[24px] font-black tracking-[-0.04em] text-[#20271d]">{program.title}</h2></div><button type="button" onClick={() => setEditing(false)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/[0.07] bg-white text-black/50"><X className="h-4 w-4" /></button></div>
            <AdminProgramEditor key={program.updatedAt} program={program} options={options} submitting={saving} onSubmit={save} />
          </div>
        </div>
      )}

      {reviewing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <button type="button" aria-label="Close review" onClick={() => setReviewing(null)} className="absolute inset-0" />
          <div className="relative z-10 w-full max-w-[560px] rounded-[24px] border border-black/[0.07] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><span className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-[#628d46]">Submission review</span><h3 className="mt-1 text-[21px] font-black text-[#20271d]">{reviewMode === "approve" ? "Approve this submission?" : "Reject this submission?"}</h3></div><button type="button" onClick={() => setReviewing(null)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/[0.04]"><X className="h-4 w-4" /></button></div>
            {reviewMode === "reject" ? (
              <label className="mt-5 block"><span className="mb-2 block text-[10px] font-bold text-black/50">Reason the partner will see</span><textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} rows={4} className="w-full rounded-[14px] border border-black/10 bg-[#fafbf8] p-3 text-[11px] leading-5 outline-none focus:border-[#6b984d]/40" placeholder="The customer was not genuinely interested." /></label>
            ) : reviewing.submissionType === "confirmed_sale" ? (
              <div className="mt-5 space-y-3">
                <p className="rounded-xl bg-amber-50 px-3 py-3 text-[10px] leading-5 text-amber-800">A confirmed sale counts only when the agreement is confirmed and the qualifying customer payment has cleared.</p>
                <div className="grid gap-3 sm:grid-cols-2"><input value={saleReference} onChange={(event) => setSaleReference(event.target.value)} className="h-11 rounded-xl border border-black/10 px-3 text-[11px]" placeholder="Sale reference" /><input type="number" min={35000} value={saleAmount} onChange={(event) => setSaleAmount(event.target.value)} className="h-11 rounded-xl border border-black/10 px-3 text-[11px]" placeholder="Sale amount ETB" /></div>
                <label className="flex items-center gap-3 rounded-xl border border-black/[0.06] p-3 text-[10px]"><input type="checkbox" checked={saleConfirmed} onChange={(event) => setSaleConfirmed(event.target.checked)} className="accent-[#426c2b]" /> Customer agreement / sale is confirmed</label>
                <label className="flex items-center gap-3 rounded-xl border border-black/[0.06] p-3 text-[10px]"><input type="checkbox" checked={paymentCleared} onChange={(event) => setPaymentCleared(event.target.checked)} className="accent-[#426c2b]" /> Qualifying customer payment has cleared</label>
              </div>
            ) : (
              <p className="mt-5 rounded-xl bg-[#f5f8f2] px-4 py-3 text-[10px] leading-5 text-black/55">Approval will update the partner&apos;s progress. If every goal is complete, the Program will be completed and its reward will become Earned.</p>
            )}
            <div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={() => setReviewing(null)} className="h-11 rounded-xl border border-black/10 text-[10px] font-bold text-black/55">Cancel</button><button type="button" disabled={busyId === reviewing.id} onClick={() => void submitReview()} className={`h-11 rounded-xl text-[10px] font-bold text-white disabled:opacity-50 ${reviewMode === "reject" ? "bg-[#b74a3d]" : "bg-[#426c2b]"}`}>{reviewMode === "reject" ? "Reject submission" : "Approve submission"}</button></div>
          </div>
        </div>
      )}

      {applyingRewardId && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <button type="button" aria-label="Close reward application" onClick={() => setApplyingRewardId(null)} className="absolute inset-0" />
          <div className="relative z-10 w-full max-w-[500px] rounded-[24px] bg-white p-6 shadow-2xl">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff4db] text-[#9a6b14]"><CircleDollarSign className="h-5 w-5" /></span>
            <h3 className="mt-4 text-[21px] font-black text-[#20271d]">Apply one commission reward</h3>
            <p className="mt-2 text-[10px] leading-5 text-black/50">Enter a unique sale reference and qualifying amount. The backend blocks a second Program bonus from stacking onto the same sale.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><input value={saleReference} onChange={(event) => setSaleReference(event.target.value)} className="h-11 rounded-xl border border-black/10 px-3 text-[11px]" placeholder="Sale reference" /><input type="number" min={35000} value={saleAmount} onChange={(event) => setSaleAmount(event.target.value)} className="h-11 rounded-xl border border-black/10 px-3 text-[11px]" placeholder="Sale amount ETB" /></div>
            <div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={() => setApplyingRewardId(null)} className="h-11 rounded-xl border border-black/10 text-[10px] font-bold">Cancel</button><button type="button" disabled={busyId === applyingRewardId} onClick={() => void rewardAction(applyingRewardId, "mark_applied")} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#426c2b] text-[10px] font-bold text-white disabled:opacity-50"><Check className="h-4 w-4" /> Mark Applied</button></div>
          </div>
        </div>
      )}

      <ConfirmDestructiveDialog
        open={confirmingDelete}
        title={deleteCopy.title}
        description={language === "am"
          ? `“${program.title}” ለተመደቡ Partners ከእንግዲህ አይገኝም። ${deleteCopy.description}`
          : `“${program.title}” will no longer be available to assigned Partners. ${deleteCopy.description}`}
        confirmLabel={deleteCopy.label}
        cancelLabel={deleteCopy.cancel}
        busy={busyId === "delete"}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={() => void removeProgram()}
      />
    </div>
  );
}
