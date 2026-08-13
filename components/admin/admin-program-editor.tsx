"use client";

import { useMemo, useState } from "react";
import {
  BadgeDollarSign,
  BookOpenCheck,
  BriefcaseBusiness,
  FileCheck2,
  FileText,
  Handshake,
  Plus,
  Sparkles,
  Target,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

import type {
  PartnerProgramDetail,
  PartnerProgramInput,
  PartnerProgramOptions,
  PartnerProgramTarget,
  PartnerProgramTargetType,
} from "@/lib/admin-programs-api";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function futureDate() {
  const value = new Date();
  value.setDate(value.getDate() + 30);
  return value.toISOString().slice(0, 10);
}

function defaultTarget(): PartnerProgramTarget {
  return { targetType: "qualified_lead", targetValue: 1, courseId: null };
}

function iconForTarget(type: PartnerProgramTargetType): PartnerProgramInput["icon"] {
  if (type === "reports") return "reports";
  if (type === "lessons" || type === "course_completion") return "training";
  if (type === "qualified_lead" || type === "leads_submitted") return "lead";
  if (type === "confirmed_sale") return "sale";
  if (type === "partner_referral") return "referral";
  if (type === "custom_challenge") return "custom";
  return "target";
}

function initialInput(program?: PartnerProgramDetail | null): PartnerProgramInput {
  return {
    title: program?.title ?? "",
    description: program?.description ?? "",
    instructions: program?.instructions ?? "",
    startDate: program?.startDate ?? today(),
    endDate: program?.endDate ?? futureDate(),
    status: program?.status ?? "active",
    assignmentScope: program?.assignmentScope ?? "everyone",
    representativeIds: program?.representativeIds ?? [],
    icon: (program?.icon as PartnerProgramInput["icon"] | undefined) ?? "lead",
    targets: program?.targets.length
      ? program.targets.map((target) => ({
          id: target.id,
          targetType: target.targetType,
          targetValue: target.targetValue,
          courseId: target.courseId,
        }))
      : [defaultTarget()],
    reward: {
      type: program?.reward.type ?? "none",
      value: program?.reward.value ?? null,
      scope: program?.reward.scope ?? null,
      description: program?.reward.description ?? "",
    },
  };
}

const fieldClass =
  "h-12 w-full rounded-[14px] border border-black/[0.08] bg-[#fafbf8] px-4 text-[12px] text-[#252b22] outline-none transition focus:border-[#6b984d]/40 focus:bg-white focus:ring-4 focus:ring-[#6b984d]/[0.07]";
const labelClass =
  "mb-2 block text-[10px] font-extrabold uppercase tracking-[0.09em] text-black/48";

const goalGroups: Array<{
  title: string;
  items: Array<{ value: PartnerProgramTargetType; label: string }>;
}> = [
  {
    title: "Automatic goals",
    items: [
      { value: "reports", label: "Reports submitted" },
      { value: "lessons", label: "Lessons completed" },
      { value: "course_completion", label: "Course completed" },
      { value: "leads_submitted", label: "Leads submitted" },
    ],
  },
  {
    title: "Verified challenges",
    items: [
      { value: "qualified_lead", label: "Qualified lead" },
      { value: "confirmed_sale", label: "Confirmed sale" },
      { value: "partner_referral", label: "Partner referral" },
      { value: "custom_challenge", label: "Custom challenge" },
    ],
  },
];

function GoalIcon({ type }: { type: PartnerProgramTargetType }) {
  const className = "h-4 w-4";
  if (type === "reports") return <FileText className={className} />;
  if (type === "lessons" || type === "course_completion") return <BookOpenCheck className={className} />;
  if (type === "leads_submitted" || type === "qualified_lead") return <BriefcaseBusiness className={className} />;
  if (type === "confirmed_sale") return <Handshake className={className} />;
  if (type === "partner_referral") return <UserPlus className={className} />;
  return <Sparkles className={className} />;
}

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
  const [input, setInput] = useState<PartnerProgramInput>(() => initialInput(program));
  const [error, setError] = useState("");
  const selected = useMemo(() => new Set(input.representativeIds), [input.representativeIds]);

  function updateTarget(index: number, patch: Partial<PartnerProgramTarget>) {
    setInput((current) => ({
      ...current,
      targets: current.targets.map((target, targetIndex) =>
        targetIndex === index ? { ...target, ...patch } : target,
      ),
    }));
  }

  function chooseTargetType(index: number, targetType: PartnerProgramTargetType) {
    updateTarget(index, {
      targetType,
      courseId: targetType === "course_completion" ? options.courses[0]?.id ?? null : null,
      targetValue: targetType === "course_completion" ? 1 : 1,
    });
    if (index === 0) {
      setInput((current) => ({ ...current, icon: iconForTarget(targetType) }));
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!input.title.trim() || !input.description.trim()) {
      setError("Add a Program name and explain what partners should do.");
      return;
    }
    if (input.endDate < input.startDate) {
      setError("The end date must be on or after the start date.");
      return;
    }
    if (input.assignmentScope === "selected" && !input.representativeIds.length) {
      setError("Choose at least one partner.");
      return;
    }
    try {
      await onSubmit({
        ...input,
        status:
          input.status === "draft" || input.status === "completed" || input.status === "archived"
            ? input.status
            : input.startDate > today()
              ? "scheduled"
              : "active",
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save the Program.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-[11px] text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-[22px] border border-black/[0.06] bg-white p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5e7] text-[#426c2b]">
            <Target className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-[15px] font-black text-[#22291f]">The challenge</h3>
            <p className="mt-0.5 text-[10px] text-black/46">Say clearly what success looks like.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className={labelClass}>Program name</span>
            <input
              value={input.title}
              maxLength={220}
              onChange={(event) => setInput((current) => ({ ...current, title: event.target.value }))}
              className={fieldClass}
              placeholder="Restaurant Client Challenge"
            />
          </label>

          <label className="sm:col-span-2">
            <span className={labelClass}>What should partners do?</span>
            <textarea
              value={input.description}
              maxLength={20000}
              rows={3}
              onChange={(event) => setInput((current) => ({ ...current, description: event.target.value }))}
              className={`${fieldClass} min-h-[96px] resize-y py-3 leading-6`}
              placeholder="Find a restaurant owner who is genuinely interested in a professional website."
            />
          </label>

          <label className="sm:col-span-2">
            <span className={labelClass}>Helpful instructions <span className="normal-case tracking-normal text-black/32">(optional)</span></span>
            <textarea
              value={input.instructions}
              maxLength={20000}
              rows={2}
              onChange={(event) => setInput((current) => ({ ...current, instructions: event.target.value }))}
              className={`${fieldClass} min-h-[76px] resize-y py-3 leading-6`}
              placeholder="Ask about the business, the person to contact, and what they need."
            />
          </label>
        </div>
      </section>

      <section className="rounded-[22px] border border-black/[0.06] bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[15px] font-black text-[#22291f]">Goal</h3>
            <p className="mt-1 text-[10px] leading-5 text-black/48">
              Automatic goals use trusted workspace activity. Verified challenges wait for admin approval.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setInput((current) => ({ ...current, targets: [...current.targets, defaultTarget()] }))}
            className="flex h-9 shrink-0 items-center gap-2 rounded-xl bg-[#edf5e7] px-3 text-[10px] font-bold text-[#426c2b]"
          >
            <Plus className="h-4 w-4" />
            Add another
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {input.targets.map((target, index) => (
            <div key={`${target.id ?? "new"}-${index}`} className="rounded-[18px] border border-black/[0.06] bg-[#fafbf8] p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_130px_auto]">
                <label>
                  <span className={labelClass}>Goal type</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f8d41]">
                      <GoalIcon type={target.targetType} />
                    </span>
                    <select
                      value={target.targetType}
                      onChange={(event) => chooseTargetType(index, event.target.value as PartnerProgramTargetType)}
                      className={`${fieldClass} pl-10`}
                    >
                      {goalGroups.map((group) => (
                        <optgroup key={group.title} label={group.title}>
                          {group.items.map((item) => (
                            <option
                              key={item.value}
                              value={item.value}
                              disabled={item.value === "course_completion" && !options.courses.length}
                            >
                              {item.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </label>

                <label>
                  <span className={labelClass}>Target</span>
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    disabled={target.targetType === "course_completion"}
                    value={target.targetValue}
                    onChange={(event) => updateTarget(index, { targetValue: Math.max(1, Number(event.target.value) || 1) })}
                    className={fieldClass}
                  />
                </label>

                <button
                  type="button"
                  aria-label="Remove goal"
                  disabled={input.targets.length === 1}
                  onClick={() => setInput((current) => ({
                    ...current,
                    targets: current.targets.filter((_, targetIndex) => targetIndex !== index),
                  }))}
                  className="mt-auto flex h-12 w-12 items-center justify-center rounded-[14px] border border-red-200 bg-red-50 text-red-500 disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {target.targetType === "course_completion" && (
                <label className="mt-3 block">
                  <span className={labelClass}>Course</span>
                  <select
                    value={target.courseId ?? ""}
                    onChange={(event) => updateTarget(index, { courseId: event.target.value || null })}
                    className={fieldClass}
                  >
                    {options.courses.map((course) => (
                      <option key={course.id} value={course.id}>{course.titleEn} ({course.status})</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[22px] border border-black/[0.06] bg-white p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff4db] text-[#a56d0b]">
            <BadgeDollarSign className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-[15px] font-black text-[#22291f]">Reward</h3>
            <p className="mt-0.5 text-[10px] text-black/46">Tracked here; money is never paid automatically.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label>
            <span className={labelClass}>Reward</span>
            <select
              value={input.reward.type}
              onChange={(event) => {
                const type = event.target.value as PartnerProgramInput["reward"]["type"];
                setInput((current) => ({
                  ...current,
                  reward: {
                    ...current.reward,
                    type,
                    value: type === "none" ? null : current.reward.value ?? (type === "bonus_commission" ? 5 : 1000),
                    scope: type === "bonus_commission" ? current.reward.scope ?? "next_qualifying_sale" : null,
                  },
                }));
              }}
              className={fieldClass}
            >
              <option value="none">Recognition only</option>
              <option value="bonus_commission">Bonus commission</option>
              <option value="fixed_etb">Fixed ETB bonus</option>
            </select>
          </label>

          {input.reward.type !== "none" && (
            <label>
              <span className={labelClass}>{input.reward.type === "bonus_commission" ? "Bonus percentage points" : "Amount (ETB)"}</span>
              <div className="relative">
                {input.reward.type === "bonus_commission" && (
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-black text-[#426c2b]">+</span>
                )}
                <input
                  type="number"
                  min={0.01}
                  step={input.reward.type === "bonus_commission" ? 0.01 : 1}
                  value={input.reward.value ?? ""}
                  onChange={(event) => setInput((current) => ({
                    ...current,
                    reward: { ...current.reward, value: Number(event.target.value) || null },
                  }))}
                  className={`${fieldClass} ${input.reward.type === "bonus_commission" ? "pl-8" : ""}`}
                />
              </div>
              {input.reward.type === "bonus_commission" && (
                <span title="20% base + 5 percentage points = 25%, not 21%." className="mt-2 block cursor-help text-[9px] leading-4 text-black/43">
                  Adds percentage points: 20% base + 5 points = 25%.
                </span>
              )}
            </label>
          )}

          {input.reward.type === "bonus_commission" && (
            <label className="sm:col-span-2">
              <span className={labelClass}>Applies to</span>
              <select
                value={input.reward.scope ?? "next_qualifying_sale"}
                onChange={(event) => setInput((current) => ({
                  ...current,
                  reward: { ...current.reward, scope: event.target.value as PartnerProgramInput["reward"]["scope"] },
                }))}
                className={fieldClass}
              >
                <option value="next_qualifying_sale">Next qualifying sale</option>
                <option value="challenge_sale">The sale associated with this challenge</option>
              </select>
            </label>
          )}

          <label className="sm:col-span-2">
            <span className={labelClass}>Reward note <span className="normal-case tracking-normal text-black/32">(optional)</span></span>
            <input
              value={input.reward.description}
              maxLength={1000}
              onChange={(event) => setInput((current) => ({
                ...current,
                reward: { ...current.reward, description: event.target.value },
              }))}
              className={fieldClass}
              placeholder="Recognition for excellent prospect research"
            />
          </label>
        </div>
      </section>

      <section className="rounded-[22px] border border-black/[0.06] bg-white p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5e7] text-[#426c2b]">
            <Users className="h-5 w-5" />
          </span>
          <h3 className="text-[15px] font-black text-[#22291f]">Timing & audience</h3>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label>
            <span className={labelClass}>Starts</span>
            <input type="date" value={input.startDate} onChange={(event) => setInput((current) => ({ ...current, startDate: event.target.value }))} className={fieldClass} />
          </label>
          <label>
            <span className={labelClass}>Ends</span>
            <input type="date" value={input.endDate} onChange={(event) => setInput((current) => ({ ...current, endDate: event.target.value }))} className={fieldClass} />
          </label>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {(["everyone", "selected"] as const).map((scope) => (
            <button
              key={scope}
              type="button"
              onClick={() => setInput((current) => ({ ...current, assignmentScope: scope }))}
              className={`h-12 rounded-[14px] border text-[11px] font-bold ${
                input.assignmentScope === scope
                  ? "border-[#6b984d]/30 bg-[#edf5e7] text-[#426c2b]"
                  : "border-black/[0.07] bg-[#fafbf8] text-black/52"
              }`}
            >
              {scope === "everyone" ? "All partners" : "Selected partners"}
            </button>
          ))}
        </div>

        {input.assignmentScope === "selected" && (
          <div className="mt-4 max-h-[280px] space-y-2 overflow-y-auto rounded-[18px] border border-black/[0.06] bg-[#fafbf8] p-3">
            {options.representatives.map((representative) => (
              <label key={representative.id} className="flex cursor-pointer items-center gap-3 rounded-[13px] bg-white px-3 py-3 text-[11px]">
                <input
                  type="checkbox"
                  checked={selected.has(representative.id)}
                  onChange={(event) => setInput((current) => ({
                    ...current,
                    representativeIds: event.target.checked
                      ? [...current.representativeIds, representative.id]
                      : current.representativeIds.filter((id) => id !== representative.id),
                  }))}
                  className="h-4 w-4 accent-[#426c2b]"
                />
                <span className="min-w-0">
                  <strong className="block truncate text-[#293027]">{representative.name}</strong>
                  <span className="mt-0.5 block text-[9px] text-black/44">{representative.partnerId}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      <button
        type="submit"
        disabled={submitting}
        className="flex h-13 w-full items-center justify-center gap-2 rounded-[14px] bg-[#426c2b] text-[12px] font-extrabold text-white shadow-[0_10px_25px_rgba(66,108,43,0.18)] disabled:opacity-50"
      >
        <FileCheck2 className="h-4 w-4" />
        {submitting ? "Saving Program..." : program ? "Save Program" : "Create Program"}
      </button>
    </form>
  );
}
