"use client";

import {
  CheckCheck,
  Clock3,
  Inbox,
  Loader2,
  Mail,
  MessageSquareReply,
  RefreshCw,
  Send,
  UserRound,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  useLanguage,
} from "@/components/providers/language-provider";

import {
  ADMIN_REPORTS_CHANGED_EVENT,
  getAdminReports,
  markAdminReportRead,
  replyToAdminReport,
  type AdminRepresentativeReport,
} from "@/lib/admin-reports-api";

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

function initials(
  name:
    string,
) {
  return name
    .split(
      /\s+/,
    )
    .filter(
      Boolean,
    )
    .slice(
      0,
      2,
    )
    .map(
      (
        part,
      ) =>
        part[0]
          ?.toUpperCase(),
    )
    .join(
      "",
    );
}

export default function AdminReports() {
  const {
    language,
  } = useLanguage();

  const [
    reports,
    setReports,
  ] =
    useState<AdminRepresentativeReport[]>(
      [],
    );

  const [
    selectedId,
    setSelectedId,
  ] =
    useState<
      string |
      null
    >(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false,
    );

  const [
    reply,
    setReply,
  ] =
    useState(
      "",
    );

  const [
    savingReply,
    setSavingReply,
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

  const copy =
    useMemo(
      () =>
        language ===
          "am"
      ? {
          eyebrow:
            "REPRESENTATIVE INBOX",

          title:
            "ሪፖርቶች",

          description:
            "ከSales Partners የተላኩ አጭር የሥራ ሪፖርቶችን ይመልከቱ እና ምላሽ ይላኩ።",

          refresh:
            "አድስ",

          inbox:
            "Inbox",

          unread:
            "ያልተነበበ",

          allRead:
            "ሁሉም ተነቧል",

          emptyTitle:
            "እስካሁን ሪፖርት የለም",

          emptyDescription:
            "Representatives ሪፖርት ሲልኩ እዚህ ይታያል።",

          selectTitle:
            "ሪፖርት ይምረጡ",

          selectDescription:
            "ሙሉ መልዕክቱን ለማንበብ ከinbox ውስጥ ሪፖርት ይምረጡ።",

          sent:
            "የተላከ",

          newLabel:
            "አዲስ",

          replied:
            "ምላሽ አለው",

          reportMessage:
            "የRepresentative ሪፖርት",

          replies:
            "የAdmin ምላሾች",

          noReplies:
            "እስካሁን ምላሽ አልተላከም።",

          seen:
            "Representative አንብቦታል",

          notSeen:
            "Representative ገና አላነበበውም",

          replyLabel:
            "ምላሽ ይጻፉ",

          replyPlaceholder:
            "አጭር እና ግልጽ ምላሽ ይጻፉ...",

          sendReply:
            "ምላሽ ላክ",

          sending:
            "በመላክ ላይ...",

          replyRequired:
            "ከመላክዎ በፊት ምላሽ ይጻፉ።",

          replySent:
            "ምላሹ ተልኳል።",

          loadError:
            "ሪፖርቶቹን መጫን አልተቻለም።",
        }
      : {
          eyebrow:
            "REPRESENTATIVE INBOX",

          title:
            "Reports",

          description:
            "Review short work reports from Sales Partners and send a clear reply when needed.",

          refresh:
            "Refresh",

          inbox:
            "Inbox",

          unread:
            "unread",

          allRead:
            "All read",

          emptyTitle:
            "No reports yet",

          emptyDescription:
            "Reports will appear here when representatives send them.",

          selectTitle:
            "Select a report",

          selectDescription:
            "Choose a report from the inbox to read the full message and reply.",

          sent:
            "Sent",

          newLabel:
            "New",

          replied:
            "Replied",

          reportMessage:
            "Representative report",

          replies:
            "Admin replies",

          noReplies:
            "No reply has been sent yet.",

          seen:
            "Seen by representative",

          notSeen:
            "Not seen by representative",

          replyLabel:
            "Write a reply",

          replyPlaceholder:
            "Write a short, clear reply...",

          sendReply:
            "Send reply",

          sending:
            "Sending...",

          replyRequired:
            "Write a reply before sending.",

          replySent:
            "Reply sent.",

          loadError:
            "Unable to load reports.",
        },
      [
        language,
      ],
    );

  const unreadCount =
    useMemo(
      () =>
        reports.filter(
          (
            report,
          ) =>
            !report.adminReadAt,
        ).length,
      [
        reports,
      ],
    );

  const selectedReport =
    useMemo(
      () =>
        reports.find(
          (
            report,
          ) =>
            report.id ===
            selectedId,
        ) ??
        null,
      [
        reports,
        selectedId,
      ],
    );

  const notifyCountChanged =
    useCallback(
      () => {
        window.dispatchEvent(
          new Event(
            ADMIN_REPORTS_CHANGED_EVENT,
          ),
        );
      },
      [],
    );

  const openReport =
    useCallback(
      async (
        report:
          AdminRepresentativeReport,
      ) => {
        setSelectedId(
          report.id,
        );

        setError(
          "",
        );

        setSuccess(
          "",
        );

        if (
          report.adminReadAt
        ) {
          return;
        }

        try {
          const updated =
            await markAdminReportRead(
              report.id,
              language,
            );

          setReports(
            (
              current,
            ) =>
              current.map(
                (
                  item,
                ) =>
                  item.id ===
                  updated.id
                    ? updated
                    : item,
              ),
          );

          notifyCountChanged();
        } catch (
          readError
        ) {
          setError(
            readError instanceof
              Error
              ? readError.message
              : copy.loadError,
          );
        }
      },
      [
        copy.loadError,
        language,
        notifyCountChanged,
      ],
    );

  const loadReports =
    useCallback(
      async (
        background =
          false,
      ) => {
        if (
          background
        ) {
          setRefreshing(
            true,
          );
        } else {
          setLoading(
            true,
          );
        }

        setError(
          "",
        );

        try {
          const result =
            await getAdminReports(
              language,
            );

          setReports(
            result.reports,
          );

          const nextSelected =
            result.reports[0] ??
            null;

          setSelectedId(
            nextSelected?.id ??
              null,
          );

          if (
            nextSelected &&
            !nextSelected
              .adminReadAt
          ) {
            void openReport(
              nextSelected,
            );
          }

          notifyCountChanged();
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : copy.loadError,
          );
        } finally {
          setLoading(
            false,
          );

          setRefreshing(
            false,
          );
        }
      },
      [
        copy.loadError,
        language,
        notifyCountChanged,
        openReport,
      ],
    );

  useEffect(
    () => {
      const timeoutId =
        window.setTimeout(
          () => {
            void loadReports();
          },
          0,
        );

      return () => {
        window.clearTimeout(
          timeoutId,
        );
      };
    },
    [
      loadReports,
    ],
  );

  async function submitReply(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const cleanReply =
      reply.trim();

    if (
      !selectedReport ||
      !cleanReply
    ) {
      setError(
        copy.replyRequired,
      );

      return;
    }

    if (
      savingReply
    ) {
      return;
    }

    setSavingReply(
      true,
    );

    setError(
      "",
    );

    setSuccess(
      "",
    );

    try {
      const updated =
        await replyToAdminReport(
          selectedReport.id,
          cleanReply,
          language,
        );

      setReports(
        (
          current,
        ) =>
          current.map(
            (
              report,
            ) =>
              report.id ===
              updated.id
                ? updated
                : report,
          ),
      );

      setReply(
        "",
      );

      setSuccess(
        copy.replySent,
      );

      notifyCountChanged();
    } catch (
      replyError
    ) {
      setError(
        replyError instanceof
          Error
          ? replyError.message
          : copy.loadError,
      );
    } finally {
      setSavingReply(
        false,
      );
    }
  }

  return (
    <div>
      <section className="rounded-[24px] border border-black/[0.06] bg-[linear-gradient(135deg,#ffffff,#f3f8ef)] p-6 shadow-[0_12px_40px_rgba(39,53,30,0.04)] sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#699549]">
              {copy.eyebrow}
            </span>

            <h2 className="mt-3 text-[30px] font-black tracking-[-0.055em] text-[#171b15] sm:text-[38px]">
              {copy.title}
            </h2>

            <p className="mt-3 max-w-[650px] text-[12px] leading-6 text-black/55">
              {copy.description}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadReports(
                true,
              )
            }
            disabled={
              refreshing
            }
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-black/[0.07] bg-white px-4 text-[11px] font-bold text-black/55 shadow-sm transition hover:text-[#426c2b] disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${
              refreshing
                ? "animate-spin"
                : ""
            }`} />

            {copy.refresh}
          </button>
        </div>
      </section>

      {error ? (
        <div
          role="alert"
          className="mt-5 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-[11px] leading-5 text-red-600"
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-5 flex min-h-[420px] items-center justify-center rounded-[24px] border border-black/[0.06] bg-white">
          <Loader2 className="h-6 w-6 animate-spin text-[#629144]" />
        </div>
      ) : reports.length ===
        0 ? (
        <div className="mt-5 flex min-h-[420px] flex-col items-center justify-center rounded-[24px] border border-black/[0.06] bg-white px-5 text-center shadow-[0_10px_35px_rgba(37,50,29,0.03)]">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf5e7] text-[#56813a]">
            <Inbox className="h-6 w-6" />
          </span>

          <h3 className="mt-5 text-[17px] font-black text-[#20251d]">
            {copy.emptyTitle}
          </h3>

          <p className="mt-2 max-w-[380px] text-[12px] leading-6 text-black/50">
            {copy.emptyDescription}
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
          <section className="overflow-hidden rounded-[22px] border border-black/[0.06] bg-white shadow-[0_10px_35px_rgba(37,50,29,0.03)]">
            <div className="flex items-center justify-between border-b border-black/[0.055] px-5 py-4">
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-[#5f8d41]" />

                <strong className="text-[13px] text-[#20251d]">
                  {copy.inbox}
                </strong>
              </div>

              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                unreadCount >
                0
                  ? "bg-red-50 text-red-600"
                  : "bg-[#edf5e7] text-[#56813a]"
              }`}>
                {unreadCount >
                0
                  ? `${unreadCount} ${copy.unread}`
                  : copy.allRead}
              </span>
            </div>

            <div className="max-h-[720px] overflow-y-auto p-2.5">
              {reports.map(
                (
                  report,
                ) => {
                  const active =
                    report.id ===
                    selectedId;

                  return (
                    <button
                      key={
                        report.id
                      }
                      type="button"
                      onClick={() =>
                        void openReport(
                          report,
                        )
                      }
                      className={`mb-1.5 w-full rounded-[16px] border p-3.5 text-left transition ${
                        active
                          ? "border-[#8fb879]/30 bg-[#f0f7eb]"
                          : "border-transparent hover:border-black/[0.05] hover:bg-[#f8faf6]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f3e1] text-[10px] font-black text-[#4d7933]">
                          {initials(
                            report
                              .representative
                              .name,
                          ) ||
                            "RP"}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <strong className="truncate text-[12px] font-black text-[#20251d]">
                              {report
                                .representative
                                .name}
                            </strong>

                            {!report.adminReadAt ? (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                            ) : null}
                          </div>

                          <span className="mt-0.5 block text-[10px] font-semibold text-[#6b914e]">
                            {report
                              .representative
                              .partnerId}
                          </span>

                          <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-black/50">
                            {report.message}
                          </p>

                          <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-black/50">
                            <span>
                              {formatDateTime(
                                report.createdAt,
                                language,
                              )}
                            </span>

                            {report.replied ? (
                              <span className="font-bold text-[#5e8b40]">
                                {copy.replied}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          </section>

          <section className="min-h-[520px] rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-[0_10px_35px_rgba(37,50,29,0.03)] sm:p-6">
            {selectedReport ? (
              <>
                <div className="flex flex-col gap-4 border-b border-black/[0.055] pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf5e7] text-[#56813a]">
                      <UserRound className="h-5 w-5" />
                    </span>

                    <div>
                      <h3 className="text-[16px] font-black text-[#20251d]">
                        {selectedReport
                          .representative
                          .name}
                      </h3>

                      <span className="mt-0.5 block text-[11px] font-bold text-[#678e4b]">
                        {selectedReport
                          .representative
                          .partnerId}
                      </span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold text-black/40 sm:justify-end">
                      <Clock3 className="h-3.5 w-3.5" />

                      {copy.sent}
                    </span>

                    <span className="mt-1 block text-[11px] text-black/55">
                      {formatDateTime(
                        selectedReport
                          .createdAt,
                        language,
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-5 rounded-[17px] border border-black/[0.055] bg-[#f8faf6] p-4 sm:p-5">
                  <span className="text-[10px] font-black uppercase tracking-[0.13em] text-[#668f49]">
                    {copy.reportMessage}
                  </span>

                  <p className="mt-3 whitespace-pre-wrap text-[13px] leading-7 text-[#2b3027]">
                    {selectedReport.message}
                  </p>
                </div>

                <div className="mt-6">
                  <div className="flex items-center gap-2">
                    <MessageSquareReply className="h-4 w-4 text-[#629144]" />

                    <h4 className="text-[13px] font-black text-[#20251d]">
                      {copy.replies}
                    </h4>
                  </div>

                  {selectedReport
                    .replies.length ===
                  0 ? (
                    <p className="mt-3 rounded-[14px] border border-dashed border-black/[0.08] bg-[#fafbf8] px-4 py-4 text-[11px] text-black/42">
                      {copy.noReplies}
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2.5">
                      {selectedReport
                        .replies.map(
                          (
                            item,
                          ) => (
                            <article
                              key={
                                item.id
                              }
                              className="rounded-[15px] border border-[#8eb579]/20 bg-[#f2f8ee] p-4"
                            >
                              <p className="whitespace-pre-wrap text-[12px] leading-6 text-[#30362b]">
                                {item.message}
                              </p>

                              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                                <span className="text-black/40">
                                  {formatDateTime(
                                    item.createdAt,
                                    language,
                                  )}
                                </span>

                                <span className={`inline-flex items-center gap-1 font-bold ${
                                  item.representativeReadAt
                                    ? "text-[#5c8740]"
                                    : "text-black/38"
                                }`}>
                                  <CheckCheck className="h-3.5 w-3.5" />

                                  {item.representativeReadAt
                                    ? copy.seen
                                    : copy.notSeen}
                                </span>
                              </div>
                            </article>
                          ),
                        )}
                    </div>
                  )}
                </div>

                <form
                  onSubmit={
                    submitReply
                  }
                  className="mt-6 border-t border-black/[0.055] pt-5"
                >
                  <label>
                    <span className="mb-2 block text-[11px] font-bold text-black/55">
                      {copy.replyLabel}
                    </span>

                    <textarea
                      rows={
                        5
                      }
                      maxLength={
                        5000
                      }
                      value={
                        reply
                      }
                      onChange={(
                        event,
                      ) =>
                        setReply(
                          event.target.value,
                        )
                      }
                      placeholder={
                        copy.replyPlaceholder
                      }
                      className="w-full resize-y rounded-[15px] border border-black/[0.08] bg-[#fafbf8] px-4 py-3.5 text-[12px] leading-6 text-[#20251d] outline-none transition placeholder:text-black/30 focus:border-[#719d52]/50"
                    />
                  </label>

                  {success ? (
                    <div
                      role="status"
                      className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-[11px] text-emerald-700"
                    >
                      {success}
                    </div>
                  ) : null}

                  <div className="mt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={
                        savingReply ||
                        !reply.trim()
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#426c2b] px-5 text-[11px] font-extrabold text-white shadow-[0_10px_24px_rgba(66,108,43,0.18)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingReply ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}

                      {savingReply
                        ? copy.sending
                        : copy.sendReply}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex min-h-[470px] flex-col items-center justify-center px-5 text-center">
                <Inbox className="h-8 w-8 text-[#67924a]" />

                <h3 className="mt-4 text-[16px] font-black text-[#20251d]">
                  {copy.selectTitle}
                </h3>

                <p className="mt-2 max-w-[360px] text-[11px] leading-5 text-black/45">
                  {copy.selectDescription}
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
