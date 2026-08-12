"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  Plus,
  Trash2,
} from "lucide-react";

import {
  type PartnerProgramDetail,
  type PartnerProgramInput,
  type PartnerProgramOptions,
  type PartnerProgramTarget,
  type PartnerProgramTargetType,
} from "@/lib/admin-programs-api";

function today() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

function futureDate() {
  const value = new Date();
  value.setDate(value.getDate() + 30);
  return value.toISOString().slice(0, 10);
}

function defaultTarget(): PartnerProgramTarget {
  return {
    targetType: "reports",
    targetValue: 4,
    courseId: null,
  };
}

function initialInput(
  program?: PartnerProgramDetail | null,
): PartnerProgramInput {
  return {
    title: program?.title ?? "",
    description: program?.description ?? "",
    startDate: program?.startDate ?? today(),
    endDate: program?.endDate ?? futureDate(),
    status: program?.status ?? "draft",
    assignmentScope: program?.assignmentScope ?? "everyone",
    representativeIds: program?.representativeIds ?? [],
    icon:
      (program?.icon as PartnerProgramInput["icon"] | undefined) ?? "target",
    targets: program?.targets.length ? program.targets : [defaultTarget()],
  };
}

const fieldClass =
  "h-11 w-full rounded-xl border border-black/[0.08] bg-[#fafbf8] px-3 text-[12px] text-[#252b22] outline-none transition focus:border-[#6b984d]/35 focus:bg-white focus:ring-4 focus:ring-[#6b984d]/[0.06]";

const labelClass =
  "mb-2 block text-[10px] font-extrabold uppercase tracking-[0.1em] text-black/48";

export default function AdminProgramEditor({
  program,
  options,
  submitting,
  onSubmit,
}: {
  program?: PartnerProgramDetail | null;
  options: PartnerProgramOptions;
  submitting: boolean;
  onSubmit: (input: PartnerProgramInput) => Promise<void> | void;
}) {
  const [input, setInput] = useState<PartnerProgramInput>(() =>
    initialInput(program),
  );
  const [error, setError] = useState("");

  const selected = useMemo(
    () => new Set(input.representativeIds),
    [input.representativeIds],
  );

  function updateTarget(
    index: number,
    patch: Partial<PartnerProgramTarget>,
  ) {
    setInput((current) => ({
      ...current,
      targets: current.targets.map((target, targetIndex) =>
        targetIndex === index ? { ...target, ...patch } : target,
      ),
    }));
  }

  function chooseTargetType(
    index: number,
    targetType: PartnerProgramTargetType,
  ) {
    updateTarget(index, {
      targetType,
      courseId:
        targetType === "course_completion"
          ? options.courses[0]?.id ?? null
          : null,
      targetValue: targetType === "course_completion" ? 1 : 4,
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!input.title.trim()) {
      setError("Enter a program title.");
      return;
    }

    if (input.endDate < input.startDate) {
      setError("The end date must be on or after the start date.");
      return;
    }

    if (
      input.assignmentScope === "selected" &&
      input.representativeIds.length === 0
    ) {
      setError("Choose at least one partner.");
      return;
    }

    try {
      await onSubmit(input);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save the program.",
      );
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[11px] text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-[20px] border border-black/[0.06] bg-white p-5">
        <h3 className="text-[14px] font-black text-[#22291f]">
          Program details
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className={labelClass}>Title</span>
            <input
              value={input.title}
              maxLength={220}
              onChange={(event) =>
                setInput((current) => ({ ...current, title: event.target.value }))
              }
              className={fieldClass}
              placeholder="Quarterly activity sprint"
            />
          </label>

          <label className="sm:col-span-2">
            <span className={labelClass}>Description</span>
            <textarea
              value={input.description}
              maxLength={20000}
              rows={4}
              onChange={(event) =>
                setInput((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className={`${fieldClass} min-h-[110px] resize-y py-3 leading-5`}
              placeholder="Explain the objective and what success looks like."
            />
          </label>

          <label>
            <span className={labelClass}>Start date</span>
            <input
              type="date"
              value={input.startDate}
              onChange={(event) =>
                setInput((current) => ({
                  ...current,
                  startDate: event.target.value,
                }))
              }
              className={fieldClass}
            />
          </label>

          <label>
            <span className={labelClass}>End date</span>
            <input
              type="date"
              value={input.endDate}
              onChange={(event) =>
                setInput((current) => ({
                  ...current,
                  endDate: event.target.value,
                }))
              }
              className={fieldClass}
            />
          </label>

          <label>
            <span className={labelClass}>Status</span>
            <select
              value={input.status}
              onChange={(event) =>
                setInput((current) => ({
                  ...current,
                  status: event.target.value as PartnerProgramInput["status"],
                }))
              }
              className={fieldClass}
            >
              {[
                "draft",
                "scheduled",
                "active",
                "completed",
                "archived",
              ].map((status) => (
                <option key={status} value={status}>
                  {status[0]?.toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className={labelClass}>Icon</span>
            <select
              value={input.icon ?? "target"}
              onChange={(event) =>
                setInput((current) => ({
                  ...current,
                  icon: event.target.value as PartnerProgramInput["icon"],
                }))
              }
              className={fieldClass}
            >
              {[
                "target",
                "growth",
                "training",
                "reports",
                "star",
                "calendar",
              ].map((icon) => (
                <option key={icon} value={icon}>
                  {icon[0]?.toUpperCase() + icon.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-[20px] border border-black/[0.06] bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-[14px] font-black text-[#22291f]">Goals</h3>
            <p className="mt-1 text-[10px] leading-5 text-black/50">
              Progress is calculated from real report and lesson records inside the program dates.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setInput((current) => ({
                ...current,
                targets: [...current.targets, defaultTarget()],
              }))
            }
            className="flex h-9 items-center gap-2 rounded-xl bg-[#edf5e7] px-3 text-[10px] font-bold text-[#426c2b]"
          >
            <Plus className="h-4 w-4" />
            Add goal
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {input.targets.map((target, index) => (
            <div
              key={`${target.id ?? "new"}-${index}`}
              className="grid gap-3 rounded-2xl border border-black/[0.055] bg-[#fafbf8] p-4 sm:grid-cols-[1fr_150px_auto]"
            >
              <label>
                <span className={labelClass}>Goal type</span>
                <select
                  value={target.targetType}
                  onChange={(event) =>
                    chooseTargetType(
                      index,
                      event.target.value as PartnerProgramTargetType,
                    )
                  }
                  className={fieldClass}
                >
                  <option value="reports">Reports submitted</option>
                  <option value="lessons">Lessons completed</option>
                  <option value="course_completion" disabled={!options.courses.length}>
                    Complete a course
                  </option>
                </select>
              </label>

              <label>
                <span className={labelClass}>Target</span>
                <input
                  type="number"
                  min={1}
                  max={100000}
                  disabled={target.targetType === "course_completion"}
                  value={target.targetValue}
                  onChange={(event) =>
                    updateTarget(index, {
                      targetValue: Math.max(1, Number(event.target.value) || 1),
                    })
                  }
                  className={fieldClass}
                />
              </label>

              <button
                type="button"
                aria-label="Remove goal"
                disabled={input.targets.length === 1}
                onClick={() =>
                  setInput((current) => ({
                    ...current,
                    targets: current.targets.filter(
                      (_, targetIndex) => targetIndex !== index,
                    ),
                  }))
                }
                className="mt-auto flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-500 disabled:opacity-35"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              {target.targetType === "course_completion" && (
                <label className="sm:col-span-3">
                  <span className={labelClass}>Course</span>
                  <select
                    value={target.courseId ?? ""}
                    onChange={(event) =>
                      updateTarget(index, { courseId: event.target.value || null })
                    }
                    className={fieldClass}
                  >
                    {options.courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.titleEn} ({course.status})
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[20px] border border-black/[0.06] bg-white p-5">
        <h3 className="text-[14px] font-black text-[#22291f]">Audience</h3>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {(["everyone", "selected"] as const).map((scope) => (
            <button
              key={scope}
              type="button"
              onClick={() =>
                setInput((current) => ({ ...current, assignmentScope: scope }))
              }
              className={`h-11 rounded-xl border text-[11px] font-bold capitalize ${
                input.assignmentScope === scope
                  ? "border-[#6b984d]/30 bg-[#edf5e7] text-[#426c2b]"
                  : "border-black/[0.07] bg-[#fafbf8] text-black/52"
              }`}
            >
              {scope === "everyone" ? "All active partners" : "Selected partners"}
            </button>
          ))}
        </div>

        {input.assignmentScope === "selected" && (
          <div className="mt-4 max-h-[280px] space-y-2 overflow-y-auto rounded-2xl border border-black/[0.06] bg-[#fafbf8] p-3">
            {options.representatives.map((representative) => (
              <label
                key={representative.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl bg-white px-3 py-3 text-[11px]"
              >
                <input
                  type="checkbox"
                  checked={selected.has(representative.id)}
                  onChange={(event) =>
                    setInput((current) => ({
                      ...current,
                      representativeIds: event.target.checked
                        ? [...current.representativeIds, representative.id]
                        : current.representativeIds.filter(
                            (id) => id !== representative.id,
                          ),
                    }))
                  }
                  className="h-4 w-4 accent-[#426c2b]"
                />
                <span className="min-w-0">
                  <strong className="block truncate text-[#293027]">
                    {representative.name}
                  </strong>
                  <span className="mt-0.5 block text-[9px] text-black/44">
                    {representative.partnerId}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      <button
        type="submit"
        disabled={submitting}
        className="h-12 w-full rounded-xl bg-[#426c2b] text-[12px] font-extrabold text-white shadow-[0_10px_25px_rgba(66,108,43,0.18)] disabled:opacity-50"
      >
        {submitting ? "Saving program..." : program ? "Save program" : "Create program"}
      </button>
    </form>
  );
}
