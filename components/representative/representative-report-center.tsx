"use client";

import {
  CheckCircle2,
  Clock3,
  Inbox,
  MessageSquareText,
  Reply,
  Send,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  useLanguage,
} from "@/components/providers/language-provider";

import {
  createRepresentativeReport,
  RepresentativeApiError,
  type RepresentativeReportsResult,
} from "@/lib/representative-api";

function formatRemaining(
  seconds:
    number,

  language:
    "en" |
    "am",
) {
  const safeSeconds =
    Math.max(
      0,
      Math.ceil(
        seconds,
      ),
    );

  const hours =
    Math.floor(
      safeSeconds /
        3600,
    );

  const minutes =
    Math.max(
      safeSeconds >
        0
        ? 1
        : 0,

      Math.ceil(
        (
          safeSeconds %
          3600
        ) /
          60,
      ),
    );

  if (
    language ===
    "am"
  ) {
    return hours >
      0
      ? `${hours} ሰ ${minutes} ደ`
      : `${minutes} ደቂቃ`;
  }

  return hours >
    0
    ? `${hours}h ${minutes}m`
    : `${minutes}m`;
}

function formatDateTime(
  value:
    string,

  language:
    "en" |
    "am",
) {
  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    language ===
      "am"
      ? "am-ET"
      : "en-US",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    },
  ).format(
    date,
  );
}

export default function RepresentativeReportCenter({
  data,
  onRefresh,
}: {
  data:
    RepresentativeReportsResult;

  onRefresh:
    () => Promise<void>;
}) {
  const {
    language,
  } = useLanguage();

  const [
    message,
    setMessage,
  ] =
    useState(
      "",
    );

  const [
    saving,
    setSaving,
  ] =
    useState(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState(
      "",
    );

  const [
    success,
    setSuccess,
  ] =
    useState(
      "",
    );

  const [
    now,
    setNow,
  ] =
    useState(
      0,
    );

  const copy =
    language ===
      "am"
      ? {
          eyebrow:
            "ለBAKI መልዕክት",

          title:
            "ሪፖርት ይላኩ",

          description:
            "ምን እንደሠሩ፣ ምን እንደተፈጠረ፣ ያገኟቸውን ሊዶች፣ ችግሮች፣ እድገት ወይም ማንኛውንም አስፈላጊ መረጃ ለBaki ይንገሩ።",

          textareaLabel:
            "የእርስዎ ሪፖርት",

          placeholder:
            "የቅርብ ጊዜ እንቅስቃሴዎን፣ ሊዶችን፣ እድገትን ወይም ችግሮችን ይጻፉ...",

          send:
            "ሪፖርት ላክ",

          sending:
            "በመላክ ላይ...",

          available:
            "አሁን ሪፖርት መላክ ይችላሉ።",

          cooldownPrefix:
            "ሌላ ሪፖርት መላክ የሚችሉት ከ",

          cooldownSuffix:
            "በኋላ ነው።",

          required:
            "ከመላክዎ በፊት አጭር ሪፖርት ይጻፉ።",

          sent:
            "ሪፖርቱ ተልኳል።",

          historyEyebrow:
            "ታሪክ",

          historyTitle:
            "የቀድሞ ሪፖርቶች",

          emptyTitle:
            "እስካሁን ሪፖርት የለም",

          emptyDescription:
            "የላኳቸው ሪፖርቶች እና የadmin ምላሾች እዚህ ይታያሉ።",

          sentLabel:
            "የተላከ",

          adminReply:
            "የAdmin ምላሽ",

          awaitingReply:
            "ምላሽ ገና አልተላከም",
        }
      : {
          eyebrow:
            "MESSAGE BAKI",

          title:
            "Send a report",

          description:
            "Tell Baki what you worked on, what happened, any leads you found, problems, updates, or anything important.",

          textareaLabel:
            "Your report",

          placeholder:
            "Write a short update about your recent activity, leads, progress, or problems...",

          send:
            "Send report",

          sending:
            "Sending...",

          available:
            "You can send a report now.",

          cooldownPrefix:
            "You can send another report in",

          cooldownSuffix:
            "",

          required:
            "Write a short report before sending.",

          sent:
            "Your report was sent.",

          historyEyebrow:
            "HISTORY",

          historyTitle:
            "Previous reports",

          emptyTitle:
            "No reports yet",

          emptyDescription:
            "Your sent reports and admin replies will appear here.",

          sentLabel:
            "Sent",

          adminReply:
            "Admin reply",

          awaitingReply:
            "No reply yet",
        };

  useEffect(
    () => {
      if (
        !data.cooldown
          .nextReportAt
      ) {
        return;
      }

      const timer =
        window.setInterval(
          () => {
            setNow(
              Date.now(),
            );
          },
          30_000,
        );

      return () => {
        window.clearInterval(
          timer,
        );
      };
    },
    [
      data.cooldown
        .nextReportAt,
    ],
  );

  const remainingSeconds =
    useMemo(
      () => {
        if (
          !data.cooldown
            .nextReportAt
        ) {
          return 0;
        }

        if (
          now ===
          0
        ) {
          return data.cooldown
            .remainingSeconds;
        }

        return Math.max(
          0,
          Math.ceil(
            (
              new Date(
                data.cooldown
                  .nextReportAt,
              ).getTime() -
              now
            ) /
              1000,
          ),
        );
      },
      [
        data.cooldown
          .nextReportAt,
        data.cooldown
          .remainingSeconds,
        now,
      ],
    );

  const canSubmit =
    remainingSeconds <=
    0;

  async function submitReport(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const cleanMessage =
      message.trim();

    if (
      !cleanMessage
    ) {
      setError(
        copy.required,
      );

      return;
    }

    if (
      saving
    ) {
      return;
    }

    setSaving(
      true,
    );

    setError(
      "",
    );

    setSuccess(
      "",
    );

    try {
      await createRepresentativeReport({
        message:
          cleanMessage,
      });

      setMessage(
        "",
      );

      setSuccess(
        copy.sent,
      );

      try {
        await onRefresh();
      } catch {
        setError(
          language ===
            "am"
            ? "ሪፖርቱ ተልኳል፣ ነገር ግን ታሪኩን ማደስ አልተቻለም።"
            : "The report was sent, but the history could not be refreshed.",
        );
      }
    } catch (
      submitError
    ) {
      if (
        submitError instanceof
          RepresentativeApiError &&
        submitError.code ===
          "REPORT_COOLDOWN"
      ) {
        try {
          await onRefresh();
        } catch {
          // The backend cooldown response below is still authoritative.
        }

        const wait =
          formatRemaining(
            submitError
              .retryAfterSeconds ??
              remainingSeconds,
            language,
          );

        setError(
          `${copy.cooldownPrefix} ${wait} ${copy.cooldownSuffix}`.trim(),
        );

        return;
      }

      setError(
        submitError instanceof
          Error
          ? submitError.message
          : language ===
              "am"
            ? "ሪፖርቱን መላክ አልተቻለም።"
            : "Unable to send the report.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <form
        onSubmit={
          submitReport
        }
        className="rounded-[24px] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5 shadow-[0_14px_45px_var(--portal-shadow)] sm:p-6"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-[var(--portal-green-soft)] text-[var(--portal-green)]">
          <MessageSquareText className="h-5 w-5" />
        </span>

        <span className="mt-5 block text-[10px] font-black uppercase tracking-[0.16em] text-[var(--portal-green)]">
          {copy.eyebrow}
        </span>

        <h2 className="mt-2 text-[24px] font-black tracking-[-0.045em]">
          {copy.title}
        </h2>

        <p className="mt-3 text-[12px] leading-6 text-[var(--portal-muted)]">
          {copy.description}
        </p>

        <label className="mt-6 block">
          <span className="mb-2 block text-[11px] font-bold text-[var(--portal-muted)]">
            {copy.textareaLabel}
          </span>

          <textarea
            rows={
              8
            }
            maxLength={
              5000
            }
            value={
              message
            }
            disabled={
              !canSubmit ||
              saving
            }
            onChange={(
              event,
            ) =>
              setMessage(
                event.target.value,
              )
            }
            placeholder={
              copy.placeholder
            }
            className="w-full resize-y rounded-[16px] border border-[var(--portal-border-strong)] bg-[var(--portal-surface-2)] px-4 py-4 text-[13px] leading-6 text-[var(--portal-text)] outline-none transition placeholder:text-[var(--portal-faint)] focus:border-[var(--portal-green)] disabled:cursor-not-allowed disabled:opacity-70"
          />

          <span className="mt-1.5 block text-right text-[10px] text-[var(--portal-faint)]">
            {message.length.toLocaleString()}
            /5,000
          </span>
        </label>

        <div
          className={`mt-4 flex items-center gap-2 rounded-[13px] border px-3.5 py-3 text-[11px] font-semibold ${
            canSubmit
              ? "border-[var(--portal-border)] bg-[var(--portal-green-soft)] text-[var(--portal-green)]"
              : "border-amber-400/20 bg-amber-400/10 text-amber-600"
          }`}
        >
          {canSubmit ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <Clock3 className="h-4 w-4 shrink-0" />
          )}

          {canSubmit
            ? copy.available
            : `${copy.cooldownPrefix} ${formatRemaining(
                remainingSeconds,
                language,
              )} ${copy.cooldownSuffix}`.trim()}
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-3 rounded-[13px] border border-red-400/20 bg-red-500/10 px-3.5 py-3 text-[11px] leading-5 text-red-500"
          >
            {error}
          </div>
        ) : null}

        {success ? (
          <div
            role="status"
            className="mt-3 rounded-[13px] border border-emerald-400/20 bg-emerald-500/10 px-3.5 py-3 text-[11px] leading-5 text-emerald-600"
          >
            {success}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={
            !canSubmit ||
            saving ||
            !message.trim()
          }
          className="mt-4 flex h-12 w-full items-center justify-center gap-2.5 rounded-[14px] bg-[var(--portal-green)] px-5 text-[12px] font-extrabold text-white shadow-[0_10px_28px_rgba(66,108,43,0.2)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />

          {saving
            ? copy.sending
            : copy.send}
        </button>
      </form>

      <section className="rounded-[24px] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5 shadow-[0_14px_45px_var(--portal-shadow)] sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[var(--portal-green-soft)] text-[var(--portal-green)]">
            <Inbox className="h-4 w-4" />
          </span>

          <div>
            <span className="block text-[10px] font-black uppercase tracking-[0.15em] text-[var(--portal-green)]">
              {copy.historyEyebrow}
            </span>

            <h2 className="mt-1 text-[18px] font-black tracking-[-0.035em]">
              {copy.historyTitle}
            </h2>
          </div>
        </div>

        {data.reports.length ===
        0 ? (
          <div className="mt-5 flex min-h-[260px] flex-col items-center justify-center rounded-[18px] border border-dashed border-[var(--portal-border-strong)] bg-[var(--portal-surface-2)] px-5 text-center">
            <MessageSquareText className="h-7 w-7 text-[var(--portal-green)]" />

            <strong className="mt-4 text-[13px]">
              {copy.emptyTitle}
            </strong>

            <p className="mt-2 max-w-[330px] text-[11px] leading-5 text-[var(--portal-muted)]">
              {copy.emptyDescription}
            </p>
          </div>
        ) : (
          <div className="mt-5 max-h-[720px] space-y-3 overflow-y-auto pr-1">
            {data.reports.map(
              (
                report,
              ) => (
                <article
                  key={
                    report.id
                  }
                  className="rounded-[18px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[var(--portal-faint)]">
                      <Clock3 className="h-3.5 w-3.5" />

                      {copy.sentLabel} · {formatDateTime(
                        report.createdAt,
                        language,
                      )}
                    </span>

                    {report.replies.some(
                      (
                        reply,
                      ) =>
                        !reply.readAt,
                    ) ? (
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.12)]" />
                    ) : null}
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-[12px] leading-6 text-[var(--portal-text)]">
                    {report.message}
                  </p>

                  {report.replies.length >
                  0 ? (
                    <div className="mt-4 space-y-2.5 border-t border-[var(--portal-border)] pt-4">
                      {report.replies.map(
                        (
                          reply,
                        ) => (
                          <div
                            key={
                              reply.id
                            }
                            className="rounded-[14px] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-3.5"
                          >
                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--portal-green)]">
                              <Reply className="h-3.5 w-3.5" />

                              {copy.adminReply}
                            </span>

                            <p className="mt-2 whitespace-pre-wrap text-[12px] leading-5 text-[var(--portal-muted)]">
                              {reply.message}
                            </p>

                            <span className="mt-2 block text-[10px] text-[var(--portal-faint)]">
                              {formatDateTime(
                                reply.createdAt,
                                language,
                              )}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <span className="mt-4 flex items-center gap-1.5 border-t border-[var(--portal-border)] pt-3 text-[10px] text-[var(--portal-faint)]">
                      <Reply className="h-3.5 w-3.5" />

                      {copy.awaitingReply}
                    </span>
                  )}
                </article>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}
