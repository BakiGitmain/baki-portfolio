"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  CalendarDays,
  Gift,
  MoreHorizontal,
  Plus,
  Target,
  Trash2,
  Users,
  X,
} from "lucide-react";

import AdminProgramEditor from "@/components/admin/admin-program-editor";
import ConfirmDestructiveDialog from "@/components/admin/confirm-destructive-dialog";
import { useLanguage } from "@/components/providers/language-provider";

import {
  createAdminProgram,
  deleteAdminProgram,
  getAdminProgramOptions,
  getAdminPrograms,
  type PartnerProgram,
  type PartnerProgramInput,
  type PartnerProgramOptions,
} from "@/lib/admin-programs-api";

const emptyOptions: PartnerProgramOptions = {
  representatives: [],
  courses: [],
};

function statusClass(status: string) {
  if (status === "active") return "bg-[#edf5e7] text-[#426c2b]";
  if (status === "scheduled" || status === "upcoming") return "bg-blue-50 text-blue-700";
  if (status === "completed") return "bg-violet-50 text-violet-700";
  if (status === "expired") return "bg-amber-50 text-amber-700";
  if (status === "archived") return "bg-black/[0.05] text-black/45";
  return "bg-amber-50 text-amber-700";
}

export default function AdminPrograms() {
  const router = useRouter();
  const { language } = useLanguage();
  const [programs, setPrograms] = useState<PartnerProgram[]>([]);
  const [options, setOptions] = useState<PartnerProgramOptions>(emptyOptions);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<PartnerProgram | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const copy = language === "am"
    ? {
        deleteProgram: "Program ሰርዝ",
        deleteTitle: "ይህን Program ይሰርዙ?",
        deleteDescription: "Programው ከAdmin እና Partner Portal ይወገዳል። አስቀድሞ የተመዘገቡ ማቅረቢያዎች፣ ሽልማቶች እና የኦዲት ታሪክ በደህና ይቀመጣሉ። ይህ እርምጃ ከዚህ ማያ መመለስ አይቻልም።",
        cancel: "ይቅር",
        openMenu: "የProgram እርምጃዎች",
      }
    : {
        deleteProgram: "Delete Program",
        deleteTitle: "Delete this Program?",
        deleteDescription: "The Program will disappear from Admin and Partner Portal. Existing submissions, rewards, and audit history will be retained safely. This action cannot be undone from this screen.",
        cancel: "Cancel",
        openMenu: "Program actions",
      };

  useEffect(() => {
    let cancelled = false;

    void Promise.all([getAdminPrograms(), getAdminProgramOptions()])
      .then(([programResult, optionResult]) => {
        if (cancelled) return;
        setPrograms(programResult);
        setOptions(optionResult);
        setError("");
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load programs.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function create(input: PartnerProgramInput) {
    setSubmitting(true);
    try {
      const program = await createAdminProgram(input);
      setCreating(false);
      router.push(`/admin/programs/${program.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function removeProgram() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteAdminProgram(deleting.id);
      setPrograms((current) => current.filter((program) => program.id !== deleting.id));
      setDeleting(null);
      setMenuId(null);
      setError("");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete the Program.");
    } finally {
      setDeleteBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[460px] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-black/10 border-t-[#426c2b]" />
      </div>
    );
  }

  return (
    <div>
      <section className="rounded-[25px] border border-black/[0.06] bg-[linear-gradient(135deg,#ffffff,#f1f7ec)] p-6 shadow-[0_12px_40px_rgba(39,53,30,0.04)] sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-[10px] font-extrabold tracking-[0.17em] text-[#628d46]">
              PARTNER PROGRAMS
            </span>
            <h2 className="mt-2 text-[30px] font-black tracking-[-0.055em] text-[#171b15] sm:text-[36px]">
              Challenges partners understand
            </h2>
            <p className="mt-3 max-w-[650px] text-[12px] leading-6 text-black/55">
              One clear challenge, one measurable goal, a deadline, and an optional reward. Automatic goals still track themselves.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#426c2b] px-5 text-[11px] font-extrabold text-white shadow-[0_9px_24px_rgba(66,108,43,0.18)]"
          >
            <Plus className="h-4 w-4" />
            New program
          </button>
        </div>
      </section>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[11px] text-red-700">
          {error}
        </div>
      )}

      <section className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {programs.map((program) => (
          <article
            key={program.id}
            className="group relative rounded-[21px] border border-black/[0.06] bg-white p-5 text-left shadow-[0_8px_28px_rgba(37,50,29,0.035)] transition hover:-translate-y-0.5 hover:border-[#719d52]/20"
          >
            <button
              type="button"
              aria-label={`${program.title} details`}
              onClick={() => router.push(`/admin/programs/${program.id}`)}
              className="absolute inset-0 z-0 rounded-[21px]"
            />
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf5e7] text-[#426c2b]">
                <Target className="h-5 w-5" />
              </span>
              <div className="relative z-20 flex items-center gap-1.5">
                <span className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold capitalize ${statusClass(program.effectiveStatus)}`}>
                  {program.effectiveStatus}
                </span>
                <button
                  type="button"
                  aria-label={copy.openMenu}
                  aria-expanded={menuId === program.id}
                  onClick={() => setMenuId((current) => current === program.id ? null : program.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.06] bg-white text-black/45 hover:bg-black/[0.03]"
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                </button>
                {menuId === program.id && (
                  <div className="absolute right-0 top-10 z-30 w-44 rounded-xl border border-black/[0.08] bg-white p-1.5 shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setDeleting(program);
                        setMenuId(null);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[10px] font-bold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {copy.deleteProgram}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <h3 className="pointer-events-none relative z-10 mt-5 text-[16px] font-black tracking-[-0.03em] text-[#22291f]">
              {program.title}
            </h3>
            <p className="mt-2 line-clamp-2 min-h-10 text-[11px] leading-5 text-black/50">
              {program.description || "No description provided."}
            </p>

            <div className="mt-5 flex items-center justify-between text-[10px] text-black/46">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {program.participantCount} partners
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {program.endDate}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl bg-[#fafbf8] px-3 py-2 text-[9px] text-black/48">
              <span className="flex items-center gap-1.5">
                <Gift className="h-3.5 w-3.5 text-[#9a6b14]" />
                {program.reward.type === "bonus_commission"
                  ? `+${program.reward.value ?? 0} percentage points`
                  : program.reward.type === "fixed_etb"
                    ? `ETB ${(program.reward.value ?? 0).toLocaleString()}`
                    : "Recognition"}
              </span>
              {program.attentionCount > 0 && (
                <strong className="rounded-full bg-[#c74f3d] px-2 py-1 text-white">
                  {program.attentionCount} need review
                </strong>
              )}
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/[0.06]">
              <div
                className="h-full rounded-full bg-[#6e9d4f]"
                style={{ width: `${program.progressPercent}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[9px] text-black/43">
              <span>{program.targetCount} goals</span>
              <strong className="text-[#426c2b]">{program.progressPercent}%</strong>
            </div>
          </article>
        ))}

        {programs.length === 0 && (
          <div className="col-span-full rounded-[21px] border border-dashed border-black/10 bg-white p-12 text-center">
            <Target className="mx-auto h-7 w-7 text-[#719d52]" />
            <h3 className="mt-4 text-[14px] font-black text-[#293027]">No programs yet</h3>
            <p className="mt-2 text-[11px] text-black/48">
              Create a clear challenge or automatic goal for your partners.
            </p>
          </div>
        )}
      </section>

      {creating && (
        <div className="fixed inset-0 z-[130] flex justify-end bg-black/35 backdrop-blur-[3px]">
          <button
            type="button"
            aria-label="Close program editor"
            onClick={() => setCreating(false)}
            className="absolute inset-0"
          />
          <div className="relative z-10 h-full w-full max-w-[760px] overflow-y-auto bg-[#f7f9f4] p-5 shadow-[-25px_0_80px_rgba(30,42,24,0.16)] sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold tracking-[0.14em] text-[#628d46]">NEW PROGRAM</span>
                <h2 className="mt-1 text-[24px] font-black tracking-[-0.04em] text-[#20271d]">Create program</h2>
              </div>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/[0.07] bg-white text-black/50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <AdminProgramEditor
              options={options}
              submitting={submitting}
              onSubmit={create}
            />
          </div>
        </div>
      )}

      <ConfirmDestructiveDialog
        open={Boolean(deleting)}
        title={copy.deleteTitle}
        description={deleting
          ? language === "am"
            ? `“${deleting.title}” ለተመደቡ Partners ከእንግዲህ አይገኝም። ${copy.deleteDescription}`
            : `“${deleting.title}” will no longer be available to assigned Partners. ${copy.deleteDescription}`
          : copy.deleteDescription}
        confirmLabel={copy.deleteProgram}
        cancelLabel={copy.cancel}
        busy={deleteBusy}
        onClose={() => {
          if (!deleteBusy) setDeleting(null);
        }}
        onConfirm={() => void removeProgram()}
      />
    </div>
  );
}
