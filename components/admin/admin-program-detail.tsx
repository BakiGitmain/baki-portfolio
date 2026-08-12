"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  Archive,
  ArrowLeft,
  CalendarDays,
  Pencil,
  Target,
  Users,
  X,
} from "lucide-react";

import AdminProgramEditor from "@/components/admin/admin-program-editor";

import {
  archiveAdminProgram,
  getAdminProgram,
  getAdminProgramOptions,
  updateAdminProgram,
  type PartnerProgramDetail,
  type PartnerProgramInput,
  type PartnerProgramOptions,
} from "@/lib/admin-programs-api";

const emptyOptions: PartnerProgramOptions = {
  representatives: [],
  courses: [],
};

function targetLabel(
  type: string,
  course?: string | null,
) {
  if (type === "reports") return "Reports submitted";
  if (type === "lessons") return "Lessons completed";
  return course ? `Complete ${course}` : "Course completion";
}

export default function AdminProgramDetail({
  programId,
}: {
  programId: string;
}) {
  const router = useRouter();
  const [program, setProgram] = useState<PartnerProgramDetail | null>(null);
  const [options, setOptions] = useState<PartnerProgramOptions>(emptyOptions);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState("");

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
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load this program.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [programId]);

  async function save(input: PartnerProgramInput) {
    setSaving(true);
    try {
      setProgram(await updateAdminProgram(programId, input));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function archive() {
    if (
      !window.confirm(
        "Archive this program? Its history stays available, but partners will no longer see it.",
      )
    ) {
      return;
    }

    setArchiving(true);
    try {
      await archiveAdminProgram(programId);
      router.push("/admin/programs");
    } catch (archiveError) {
      setError(
        archiveError instanceof Error
          ? archiveError.message
          : "Unable to archive the program.",
      );
      setArchiving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[480px] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-black/10 border-t-[#426c2b]" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="rounded-[22px] border border-red-200 bg-red-50 p-6 text-[12px] text-red-700">
        {error || "Program not found."}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link
        href="/admin/programs"
        className="inline-flex items-center gap-2 text-[11px] font-bold text-[#527b3a]"
      >
        <ArrowLeft className="h-4 w-4" />
        All programs
      </Link>

      <section className="rounded-[25px] border border-black/[0.06] bg-[linear-gradient(135deg,#ffffff,#f1f7ec)] p-6 shadow-[0_12px_40px_rgba(39,53,30,0.04)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#edf5e7] px-2.5 py-1 text-[9px] font-extrabold capitalize text-[#426c2b]">
                {program.effectiveStatus}
              </span>
              {program.status !== program.effectiveStatus && (
                <span className="text-[9px] text-black/43">
                  Stored as {program.status}; dates determine the live state
                </span>
              )}
            </div>
            <h2 className="mt-3 text-[30px] font-black tracking-[-0.055em] text-[#171b15] sm:text-[38px]">
              {program.title}
            </h2>
            <p className="mt-3 text-[12px] leading-6 text-black/55">
              {program.description || "No description provided."}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex h-10 items-center gap-2 rounded-xl border border-black/[0.07] bg-white px-4 text-[10px] font-bold text-[#35412f]"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            <button
              type="button"
              disabled={archiving || program.status === "archived"}
              onClick={() => void archive()}
              className="flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-[10px] font-bold text-red-600 disabled:opacity-45"
            >
              <Archive className="h-4 w-4" />
              Archive
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[11px] text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Overall progress",
            value: `${program.progressPercent}%`,
            icon: <Target className="h-5 w-5" />,
          },
          {
            label: "Participants",
            value: program.participantCount,
            icon: <Users className="h-5 w-5" />,
          },
          {
            label: "Goals",
            value: program.targetCount,
            icon: <Target className="h-5 w-5" />,
          },
          {
            label: "Date window",
            value: `${program.startDate} → ${program.endDate}`,
            icon: <CalendarDays className="h-5 w-5" />,
          },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-[20px] border border-black/[0.06] bg-white p-5 shadow-[0_8px_28px_rgba(37,50,29,0.035)]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5e7] text-[#426c2b]">
              {item.icon}
            </span>
            <strong className="mt-4 block text-[17px] font-black text-[#22291f]">
              {item.value}
            </strong>
            <span className="mt-1 block text-[10px] text-black/48">
              {item.label}
            </span>
          </article>
        ))}
      </section>

      <section className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-[0_10px_34px_rgba(37,50,29,0.035)] sm:p-6">
        <span className="text-[10px] font-extrabold tracking-[0.14em] text-[#628d46]">
          TIMELINE
        </span>
        <h3 className="mt-1.5 text-[19px] font-black tracking-[-0.03em] text-[#22291f]">
          Program window
        </h3>
        <div className="mt-5 grid grid-cols-[auto_1fr_auto] items-center gap-3">
          <div>
            <span className="block text-[9px] font-bold uppercase tracking-[0.09em] text-black/38">
              Starts
            </span>
            <strong className="mt-1 block text-[11px] text-[#293027]">
              {program.startDate}
            </strong>
          </div>
          <div className="relative h-8">
            <span className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#e4ecdf]" />
            <span className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-[#70a650] shadow-sm" />
            <span className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-[#426c2b] shadow-sm" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d8e6cf] bg-white px-3 py-1 text-[9px] font-extrabold capitalize text-[#426c2b] shadow-sm">
              {program.effectiveStatus}
            </span>
          </div>
          <div className="text-right">
            <span className="block text-[9px] font-bold uppercase tracking-[0.09em] text-black/38">
              Ends
            </span>
            <strong className="mt-1 block text-[11px] text-[#293027]">
              {program.endDate}
            </strong>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-[0_10px_34px_rgba(37,50,29,0.035)] sm:p-6">
          <span className="text-[10px] font-extrabold tracking-[0.14em] text-[#628d46]">GOALS</span>
          <h3 className="mt-1.5 text-[19px] font-black tracking-[-0.03em] text-[#22291f]">
            Measurement rules
          </h3>
          <div className="mt-4 space-y-3">
            {program.targets.map((target) => (
              <div
                key={target.id}
                className="rounded-2xl border border-black/[0.055] bg-[#fafbf8] p-4"
              >
                <strong className="block text-[11px] text-[#293027]">
                  {targetLabel(target.targetType, target.courseTitleEn)}
                </strong>
                <span className="mt-1 block text-[10px] text-black/48">
                  Target: {target.targetValue}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="overflow-hidden rounded-[22px] border border-black/[0.06] bg-white shadow-[0_10px_34px_rgba(37,50,29,0.035)]">
          <div className="p-5 sm:p-6">
            <span className="text-[10px] font-extrabold tracking-[0.14em] text-[#628d46]">RANKING</span>
            <h3 className="mt-1.5 text-[19px] font-black tracking-[-0.03em] text-[#22291f]">
              Partner progress
            </h3>
            <p className="mt-1 text-[10px] leading-5 text-black/50">
              Ranked only from completion against the configured goals.
            </p>
          </div>
          <div className="overflow-x-auto border-t border-black/[0.055]">
            <table className="w-full min-w-[520px] text-left">
              <thead className="bg-[#f8faf6]">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.09em] text-black/42">Partner</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.09em] text-black/42">Goal values</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.09em] text-black/42">Progress</th>
                </tr>
              </thead>
              <tbody>
                {program.ranking.map((participant, index) => (
                  <tr
                    key={participant.representativeId}
                    className="border-t border-black/[0.05]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#edf5e7] text-[10px] font-black text-[#426c2b]">
                          {index + 1}
                        </span>
                        <span>
                          <strong className="block text-[11px] text-[#293027]">{participant.name}</strong>
                          <span className="mt-0.5 block text-[9px] text-black/43">{participant.partnerId}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[10px] text-black/50">
                      {participant.targets.map((target) => `${target.actualValue}/${target.targetValue}`).join(" · ") || "No goals"}
                    </td>
                    <td className="px-5 py-4">
                      <strong className="text-[12px] text-[#426c2b]">{participant.progressPercent}%</strong>
                      <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-black/[0.06]">
                        <div
                          className="h-full rounded-full bg-[#70a650]"
                          style={{ width: `${participant.progressPercent}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {program.ranking.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-[11px] text-black/45">
                      No eligible partners are assigned to this program.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      {editing && (
        <div className="fixed inset-0 z-[130] flex justify-end bg-black/35 backdrop-blur-[3px]">
          <button
            type="button"
            aria-label="Close program editor"
            onClick={() => setEditing(false)}
            className="absolute inset-0"
          />
          <div className="relative z-10 h-full w-full max-w-[760px] overflow-y-auto bg-[#f7f9f4] p-5 shadow-[-25px_0_80px_rgba(30,42,24,0.16)] sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold tracking-[0.14em] text-[#628d46]">EDIT PROGRAM</span>
                <h2 className="mt-1 text-[24px] font-black tracking-[-0.04em] text-[#20271d]">{program.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/[0.07] bg-white text-black/50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <AdminProgramEditor
              key={program.updatedAt}
              program={program}
              options={options}
              submitting={saving}
              onSubmit={save}
            />
          </div>
        </div>
      )}
    </div>
  );
}
