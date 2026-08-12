"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import Link from "next/link";

import {
  Activity,
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquareText,
  Radio,
  Target,
  UserCheck,
  Users,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import {
  useLanguage,
} from "@/components/providers/language-provider";

import {
  ADMIN_REPORTS_CHANGED_EVENT,
} from "@/lib/admin-reports-api";

import {
  getAdminDashboard,
  type AdminDashboardData,
  type AdminDashboardRange,
} from "@/lib/admin-dashboard-api";

const activityConfig = {
  reports: {
    label: "Reports",
    color: "#426c2b",
  },
  lessonCompletions: {
    label: "Lesson completions",
    color: "#89b769",
  },
  applications: {
    label: "Applications",
    color: "#d0a04a",
  },
} satisfies ChartConfig;

const distributionConfig = {
  partners: {
    label: "Partners",
    color: "#5f8d41",
  },
} satisfies ChartConfig;

const reportConfig = {
  reports: {
    label: "Reports",
    color: "#426c2b",
  },
} satisfies ChartConfig;

type PartnerSort =
  | "activity"
  | "reports"
  | "lessons"
  | "training"
  | "name";

function formatDate(
  value: string,
  language: "en" | "am",
  withTime = false,
) {
  return new Intl.DateTimeFormat(
    language === "am" ? "am-ET" : "en-GB",
    withTime
      ? {
          dateStyle: "medium",
          timeStyle: "short",
        }
      : {
          month: "short",
          day: "numeric",
        },
  ).format(new Date(value));
}

function validComparison(
  current: number,
  previous: number,
) {
  return previous > 0
    ? Math.round(((current - previous) / previous) * 100)
    : null;
}

function Heading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#628d46]">
        {eyebrow}
      </span>
      <h2 className="mt-1.5 text-[20px] font-black tracking-[-0.04em] text-[#1d231b]">
        {title}
      </h2>
      <p className="mt-1 max-w-2xl text-[11px] leading-5 text-black/52">
        {description}
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
  icon,
  change,
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: ReactNode;
  change?: number | null;
}) {
  return (
    <article className="rounded-[20px] border border-black/[0.06] bg-white p-5 shadow-[0_8px_28px_rgba(37,50,29,0.035)]">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5e7] text-[#4f7937]">
          {icon}
        </span>
        {typeof change === "number" && (
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-bold ${
              change >= 0
                ? "bg-[#edf5e7] text-[#426c2b]"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {change > 0 ? "+" : ""}
            {change}%
          </span>
        )}
      </div>
      <strong className="mt-5 block text-[28px] font-black tracking-[-0.05em] text-[#192018]">
        {value}
      </strong>
      <h3 className="mt-1 text-[12px] font-bold text-[#2d342a]">
        {label}
      </h3>
      <p className="mt-1.5 text-[11px] leading-5 text-black/52">
        {detail}
      </p>
    </article>
  );
}

export default function AdminDashboard() {
  const { language } = useLanguage();
  const [range, setRange] = useState<AdminDashboardRange>(30);
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [partnerSort, setPartnerSort] = useState<PartnerSort>("activity");

  const copy =
    language === "am"
      ? {
          title: "á‹¨áŒ‹áˆ« áˆ¥áˆ« áˆ›á‹•áŠ¨áˆ",
          description:
            "á‹¨áŠ áŒ‹áˆ®á‰½áŠ•á£ áˆªá–áˆ­á‰¶á‰½áŠ•á£ áˆµáˆáŒ áŠ“áŠ• áŠ¥áŠ“ á•áˆ®áŒáˆ«áˆžá‰½áŠ• á‰ á‹ˆ‰á‰³á‹Š á‹¨á‹³á‰³ áˆ˜áˆ¨áŒƒ á‹­á‰†áŒ£áŒ áˆ©á¢",
          overview: "á‹¨áˆ¥áˆ« áŠ áŒ á‰ƒáˆ‹á‹­ áˆáŠ”á‰³",
          recent: "á‹¨á‰…áˆ­á‰¥ áŠ¥áŠ•á‰…áˆµá‰ƒáˆ´",
          attention: "á‰µáŠ©áˆ¨á‰µ á‹¨áˆšáŒ á‹­á‰",
          empty: "áŠ¥áˆµáŠ«áˆáŠ• á‹µáˆ¨áˆµ á‹³á‰³ á‹¨áˆˆáˆá¢",
        }
      : {
          title: "Operational control center",
          description:
            "A live view of partner activity, reports, training progress, applications, and programs using production records.",
          overview: "Operations overview",
          recent: "Recent activity",
          attention: "Attention needed",
          empty: "No records are available yet.",
        };

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);

      try {
        setData(await getAdminDashboard(range));
        setError("");
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load the operations dashboard.",
        );
      } finally {
        setLoading(false);
      }
    },
    [range],
  );

  useEffect(() => {
    let cancelled = false;

    void getAdminDashboard(range)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError("");
      })
      .catch((loadError) => {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load the operations dashboard.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [range]);

  useEffect(() => {
    const refresh = () => void load(true);
    window.addEventListener(ADMIN_REPORTS_CHANGED_EVENT, refresh);
    return () =>
      window.removeEventListener(ADMIN_REPORTS_CHANGED_EVENT, refresh);
  }, [load]);

  const series = useMemo(
    () =>
      data?.activitySeries.map((point) => ({
        ...point,
        label: formatDate(point.date, language),
      })) ?? [],
    [data, language],
  );

  const partnerPerformance = useMemo(() => {
    const partners = [...(data?.partnerPerformance ?? [])];

    return partners.sort((left, right) => {
      if (partnerSort === "name") {
        return left.name.localeCompare(right.name);
      }

      if (partnerSort === "reports") {
        return right.reports - left.reports;
      }

      if (partnerSort === "lessons") {
        return right.lessonCompletions - left.lessonCompletions;
      }

      if (partnerSort === "training") {
        return right.trainingPercent - left.trainingPercent;
      }

      return (
        new Date(right.lastActivityAt ?? 0).getTime() -
        new Date(left.lastActivityAt ?? 0).getTime()
      );
    });
  }, [data, partnerSort]);

  if (loading && !data) {
    return (
      <div className="flex min-h-[520px] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-black/10 border-t-[#426c2b]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-[22px] border border-red-200 bg-red-50 p-6 text-[12px] text-red-700">
        {error || copy.empty}
      </div>
    );
  }

  const metrics = data.metrics;
  const activityLabels: Record<string, string> = {
    application_submitted: "Application submitted",
    application_status_changed: "Application status updated",
    representative_accepted: "Partner accepted",
    representative_login: "Partner signed in",
    report_created: "Report submitted",
    report_replied: "Report replied to",
    lesson_completed: "Lesson completed",
    profile_updated: "Profile updated",
    avatar_updated: "Profile picture updated",
    avatar_deleted: "Profile picture removed",
    program_created: "Program created",
    program_updated: "Program updated",
    program_archived: "Program archived",
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[26px] border border-black/[0.06] bg-[linear-gradient(135deg,#ffffff_0%,#f1f7ec_100%)] p-6 shadow-[0_14px_45px_rgba(39,53,30,0.045)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="text-[10px] font-extrabold tracking-[0.18em] text-[#628d46]">
              PARTNER OPERATIONS
            </span>
            <h2 className="mt-2 text-[30px] font-black tracking-[-0.055em] text-[#171b15] sm:text-[38px]">
              {copy.title}
            </h2>
            <p className="mt-3 max-w-[720px] text-[12px] leading-6 text-black/55">
              {copy.description}
            </p>
          </div>
          <div className="flex rounded-xl border border-black/[0.07] bg-white p-1 shadow-sm">
            {([7, 30, 90] as const).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => {
                  if (days === range) return;
                  setLoading(true);
                  setRange(days);
                }}
                className={`h-9 rounded-lg px-3 text-[11px] font-bold transition ${
                  range === days
                    ? "bg-[#edf5e7] text-[#426c2b]"
                    : "text-black/48 hover:text-black/70"
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] text-amber-800">
          {error}
        </div>
      )}

      <section>
        <Heading
          eyebrow="LIVE DATABASE"
          title={copy.overview}
          description={`Current state plus activity during the selected ${range}-day window.`}
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Active partners"
            value={metrics.activePartners}
            detail={`${metrics.operationalPartners} active in range · ${metrics.totalPartners} total`}
            icon={<Users className="h-5 w-5" />}
          />
          <Metric
            label="Applications"
            value={metrics.applications.current}
            detail={`${metrics.applications.pending} awaiting a final decision`}
            change={validComparison(
              metrics.applications.current,
              metrics.applications.previous,
            )}
            icon={<UserCheck className="h-5 w-5" />}
          />
          <Metric
            label="Partner reports"
            value={metrics.reports.current}
            detail={`${metrics.reports.today} today · ${metrics.reports.unread} unread`}
            change={validComparison(
              metrics.reports.current,
              metrics.reports.previous,
            )}
            icon={<FileText className="h-5 w-5" />}
          />
          <Metric
            label="Lesson completions"
            value={metrics.lessonCompletions.current}
            detail={`${metrics.publishedCourses} published courses`}
            change={validComparison(
              metrics.lessonCompletions.current,
              metrics.lessonCompletions.previous,
            )}
            icon={<BookOpenCheck className="h-5 w-5" />}
          />
          <Metric
            label="Active programs"
            value={metrics.activePrograms}
            detail="Programs currently inside their live date window"
            icon={<Target className="h-5 w-5" />}
          />
          <Metric
            label="Reports this week"
            value={metrics.reports.week}
            detail="Rolling seven-day report volume"
            icon={<MessageSquareText className="h-5 w-5" />}
          />
          <Metric
            label="Online partners"
            value={metrics.onlinePartners ?? "—"}
            detail={
              data.capabilities.liveChatPresence
                ? "Live Partner Chat presence"
                : "Realtime presence is unavailable"
            }
            icon={<Radio className="h-5 w-5" />}
          />
          <Metric
            label="Published courses"
            value={metrics.publishedCourses}
            detail="Currently available to active partners"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.65fr_0.8fr]">
        <article className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-[0_10px_34px_rgba(37,50,29,0.035)] sm:p-6">
          <Heading
            eyebrow="TREND"
            title="Daily activity"
            description="Reports, lesson completions, and applications by day."
          />
          {series.some(
            (point) =>
              point.reports > 0 ||
              point.lessonCompletions > 0 ||
              point.applications > 0,
          ) ? (
            <ChartContainer
              config={activityConfig}
              className="mt-5 h-[300px] w-full"
            >
              <LineChart
              accessibilityLayer
              data={series}
              margin={{ left: 4, right: 12 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={24}
                tickMargin={10}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Line
                dataKey="reports"
                type="monotone"
                stroke="var(--color-reports)"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                dataKey="lessonCompletions"
                type="monotone"
                stroke="var(--color-lessonCompletions)"
                strokeWidth={2.25}
                dot={false}
              />
              <Line
                dataKey="applications"
                type="monotone"
                stroke="var(--color-applications)"
                strokeWidth={2}
                dot={false}
              />
              </LineChart>
            </ChartContainer>
          ) : (
            <div className="mt-5 flex h-[300px] items-center justify-center rounded-[18px] border border-dashed border-black/10 bg-[#fafbf8] px-6 text-center text-[11px] leading-5 text-black/45">
              No report, lesson-completion, or application activity exists in this date range.
            </div>
          )}
        </article>

        <article className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-[0_10px_34px_rgba(37,50,29,0.035)] sm:p-6">
          <Heading
            eyebrow="SERVICE LEVEL"
            title="Report health"
            description={`Calculated from the selected ${range}-day window.`}
          />
          <div className="mt-5 space-y-3">
            {[
              {
                label: "Reports per active reporter",
                value: data.reportStats.averagePerActivePartner.toFixed(1),
                icon: <Activity className="h-4 w-4" />,
              },
              {
                label: "Reports with a reply",
                value: `${data.reportStats.replied}/${data.reportStats.total}`,
                icon: <MessageSquareText className="h-4 w-4" />,
              },
              {
                label: "Average first reply",
                value:
                  data.reportStats.averageReplyMinutes === null
                    ? "No replies yet"
                    : `${Math.round(data.reportStats.averageReplyMinutes)} min`,
                icon: <Clock3 className="h-4 w-4" />,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-2xl border border-black/[0.055] bg-[#f8faf6] p-3.5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#527b3a] shadow-sm">
                  {item.icon}
                </span>
                <div>
                  <span className="block text-[10px] text-black/50">
                    {item.label}
                  </span>
                  <strong className="mt-0.5 block text-[14px] text-[#20271d]">
                    {item.value}
                  </strong>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4">
            <strong className="text-[10px] text-amber-800">
              Lead analytics intentionally omitted
            </strong>
            <p className="mt-1 text-[10px] leading-5 text-amber-800/75">
              {data.capabilities.leads.reason}
            </p>
          </div>
        </article>
      </section>

      <section className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-[0_10px_34px_rgba(37,50,29,0.035)] sm:p-6">
        <Heading
          eyebrow="REPORT VOLUME"
          title="Reports over time"
          description={`Daily report submissions in the selected ${range}-day window.`}
        />
        {series.some((point) => point.reports > 0) ? (
          <ChartContainer
            config={reportConfig}
            className="mt-5 h-[250px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={series}
              margin={{ left: 4, right: 12 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={24}
                tickMargin={10}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar
                dataKey="reports"
                fill="var(--color-reports)"
                radius={[5, 5, 0, 0]}
                maxBarSize={34}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="mt-5 flex h-[250px] items-center justify-center rounded-[18px] border border-dashed border-black/10 bg-[#fafbf8] px-6 text-center text-[11px] leading-5 text-black/45">
            No reports were submitted in this date range.
          </div>
        )}
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-[0_10px_34px_rgba(37,50,29,0.035)] sm:p-6">
          <Heading
            eyebrow="DISTRIBUTION"
            title="Training progress"
            description="Partner completion across every published lesson."
          />
          {data.training.distribution.some((bucket) => bucket.partners > 0) ? (
            <ChartContainer
              config={distributionConfig}
              className="mt-5 h-[260px] w-full"
            >
              <BarChart
              accessibilityLayer
              data={data.training.distribution}
              layout="vertical"
              margin={{ left: 8, right: 12 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="4 4" />
              <XAxis
                type="number"
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                dataKey="bucket"
                type="category"
                width={76}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar
                dataKey="partners"
                fill="var(--color-partners)"
                radius={6}
              />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="mt-5 flex h-[260px] items-center justify-center rounded-[18px] border border-dashed border-black/10 bg-[#fafbf8] px-6 text-center text-[11px] leading-5 text-black/45">
              No published-course progress is available yet.
            </div>
          )}
        </article>

        <article className="overflow-hidden rounded-[22px] border border-black/[0.06] bg-white shadow-[0_10px_34px_rgba(37,50,29,0.035)]">
          <div className="p-5 sm:p-6">
            <Heading
              eyebrow="COURSE RANKING"
              title="Completion by course"
              description="Completed lessons divided by all partner-lesson opportunities."
            />
          </div>
          <div className="overflow-x-auto border-t border-black/[0.055]">
            <table className="w-full min-w-[560px] text-left">
              <thead className="bg-[#f8faf6]">
                <tr>
                  {[
                    "Course",
                    "Lessons",
                    "Completion",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.09em] text-black/42"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.training.courses.map((course) => (
                  <tr key={course.id} className="border-t border-black/[0.05]">
                    <td className="px-5 py-4 text-[12px] font-bold text-[#262d23]">
                      {language === "am" ? course.titleAm : course.titleEn}
                    </td>
                    <td className="px-5 py-4 text-[11px] text-black/52">
                      {course.lessons}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
                          <div
                            className="h-full rounded-full bg-[#6d9d4e]"
                            style={{ width: `${course.completionPercent}%` }}
                          />
                        </div>
                        <strong className="w-10 text-right text-[11px] text-[#426c2b]">
                          {course.completionPercent}%
                        </strong>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.training.courses.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-[11px] text-black/45">
                      {copy.empty}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-[22px] border border-black/[0.06] bg-white shadow-[0_10px_34px_rgba(37,50,29,0.035)]">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <Heading
            eyebrow="FACTUAL RANKING"
            title="Partner activity"
            description={`Source metrics from this ${range}-day window. No synthetic score is used, and lead columns are omitted because no lead entity exists.`}
          />

          <label className="shrink-0">
            <span className="mb-1.5 block text-[9px] font-extrabold uppercase tracking-[0.1em] text-black/40">
              Sort partners
            </span>
            <select
              value={partnerSort}
              onChange={(event) => setPartnerSort(event.target.value as PartnerSort)}
              className="h-10 min-w-[170px] rounded-xl border border-black/[0.08] bg-[#f8faf6] px-3 text-[11px] font-bold text-[#2d342a] outline-none focus:border-[#6e9a4e]/40 focus:ring-4 focus:ring-[#6e9a4e]/[0.06]"
            >
              <option value="activity">Latest activity</option>
              <option value="reports">Reports</option>
              <option value="lessons">Lessons completed</option>
              <option value="training">Training progress</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>
        <div className="overflow-x-auto border-t border-black/[0.055]">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-[#f8faf6]">
              <tr>
                {[
                  "Partner",
                  "Reports",
                  "Lessons completed",
                  "Training",
                  "Last activity",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.09em] text-black/42"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {partnerPerformance.map((partner) => (
                <tr key={partner.id} className="border-t border-black/[0.05]">
                  <td className="px-5 py-4">
                    <strong className="block text-[12px] text-[#252c22]">
                      {partner.name}
                    </strong>
                    <span className="mt-0.5 block text-[10px] text-black/43">
                      {partner.partnerId}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[12px] font-bold text-[#426c2b]">
                    {partner.reports}
                  </td>
                  <td className="px-5 py-4 text-[12px] text-black/58">
                    {partner.lessonCompletions}
                  </td>
                  <td className="px-5 py-4 text-[12px] text-black/58">
                    {partner.trainingPercent}%
                  </td>
                  <td className="px-5 py-4 text-[10px] text-black/48">
                    {partner.lastActivityAt
                      ? formatDate(partner.lastActivityAt, language, true)
                      : "No activity yet"}
                  </td>
                </tr>
              ))}
              {partnerPerformance.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[11px] text-black/45">
                    {copy.empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-[0_10px_34px_rgba(37,50,29,0.035)] sm:p-6">
          <Heading
            eyebrow="TIMELINE"
            title={copy.recent}
            description="Recent events from source records and operational activity."
          />
          <div className="mt-5 space-y-2">
            {data.recentActivity.slice(0, 12).map((item) => (
              <div
                key={`${item.type}-${item.entityId}-${item.createdAt}`}
                className="flex gap-3 rounded-2xl border border-black/[0.05] bg-[#fafbf8] p-3.5"
              >
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#75a654]" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-[11px] text-[#293027]">
                      {activityLabels[item.type] ?? item.type.replaceAll("_", " ")}
                    </strong>
                    <span className="text-[9px] text-black/40">
                      {formatDate(item.createdAt, language, true)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[10px] leading-5 text-black/50">
                    {item.representativeName && (
                      <span className="font-semibold text-black/65">
                        {item.representativeName} ·{" "}
                      </span>
                    )}
                    {item.subject}
                  </p>
                </div>
              </div>
            ))}
            {data.recentActivity.length === 0 && (
              <p className="py-8 text-center text-[11px] text-black/45">
                {copy.empty}
              </p>
            )}
          </div>
        </article>

        <article className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-[0_10px_34px_rgba(37,50,29,0.035)] sm:p-6">
          <Heading
            eyebrow="QUEUE"
            title={copy.attention}
            description="Concrete records that may need an administrator’s review."
          />
          <div className="mt-5 space-y-2">
            {data.attention.map((item) => (
              <Link
                key={`${item.type}-${item.entityId}`}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl border border-black/[0.055] bg-[#fafbf8] p-3.5 transition hover:border-[#6f9a52]/20 hover:bg-[#f5f8f2]"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    item.severity === "high"
                      ? "bg-red-50 text-red-500"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-[11px] text-[#293027]">
                    {item.label}
                  </strong>
                  <span className="mt-0.5 block text-[10px] capitalize text-black/46">
                    {item.type.replaceAll("_", " ")}
                  </span>
                </span>
                <span className="text-[9px] text-black/38">
                  {formatDate(item.createdAt, language)}
                </span>
              </Link>
            ))}
            {data.attention.length === 0 && (
              <div className="flex flex-col items-center py-10 text-center">
                <CheckCircle2 className="h-7 w-7 text-[#6c9a4d]" />
                <strong className="mt-3 text-[12px] text-[#2d3529]">
                  Nothing is overdue
                </strong>
                <span className="mt-1 text-[10px] text-black/45">
                  No current records match the attention rules.
                </span>
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
