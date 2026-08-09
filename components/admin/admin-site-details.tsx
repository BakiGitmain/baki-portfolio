"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import Link from "next/link";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ReferenceLine,
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
  getSite,
  getSiteAnalytics,
  type AvailableSiteAnalytics,
  type MonitoredSite,
  type SiteAnalytics,
  type SiteAnalyticsRange,
} from "@/lib/sites-api";

import {
  useLanguage,
} from "@/components/providers/language-provider";

/* =========================================================
   CONSTANTS
   ========================================================= */

const DEVICE_COLORS = [
  "#426c2b",
  "#80c93c",
  "#8eaa76",
  "#b0c59f",
  "#d0ddc7",
  "#687764",
];

/* =========================================================
   ICONS
   ========================================================= */

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M19 12H5M11 18L5 12L11 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 5H19V10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M12 12L19 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M19 14V18C19 18.6 18.6 19 18 19H6C5.4 19 5 18.6 5 18V6C5 5.4 5.4 5 6 5H10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        cx="9"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M3.5 19C3.5 15.9 5.9 13.5 9 13.5C12.1 13.5 14.5 15.9 14.5 19"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M15 5.5C17.1 5.7 18.5 7 18.5 9C18.5 10.9 17.2 12.1 15.5 12.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M16.5 14.5C19 15 20.5 16.7 20.5 19"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 12C5.3 8.4 8.3 6.5 12 6.5C15.7 6.5 18.7 8.4 21 12C18.7 15.6 15.7 17.5 12 17.5C8.3 17.5 5.3 15.6 3 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <circle
        cx="12"
        cy="12"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 19V12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M10 19V5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M16 19V9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M22 19V3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M3.5 12H20.5M12 3.5C14.4 5.8 15.5 8.7 15.5 12C15.5 15.3 14.4 18.2 12 20.5M12 3.5C9.6 5.8 8.5 8.7 8.5 12C8.5 15.3 9.6 18.2 12 20.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 12H7L9.2 7L13 17L15.5 11H21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SpeedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 17C4.4 15.8 4 14.5 4 13C4 8.6 7.6 5 12 5C16.4 5 20 8.6 20 13C20 14.5 19.6 15.8 19 17"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M12 13L16 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="13"
        r="1.5"
        fill="currentColor"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M12 3V5M12 19V21M3 12H5M19 12H21M5.6 5.6L7 7M17 17L18.4 18.4M18.4 5.6L17 7M7 17L5.6 18.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrendingIcon({
  down = false,
}: {
  down?: boolean;
}) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={
          down
            ? "M4 7L10 13L14 9L20 15"
            : "M4 17L10 11L14 15L20 9"
        }
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d={
          down
            ? "M15 15H20V10"
            : "M15 9H20V14"
        }
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4L21 20H3L12 4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M12 9V14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="17"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}

/* =========================================================
   TYPES
   ========================================================= */

type TabKey =
  | "overview"
  | "analytics"
  | "performance"
  | "health"
  | "settings";

type AdminSiteDetailsProps = {
  siteId: string;
};

type TrafficPoint = {
  date: string;
  label: string;
  visitors: number;
  pageViews: number;
};

type PlaceholderTrendPoint =
  TrafficPoint & {
    performance: number;
    responseTime: number;
    uptime: number;
  };

/* =========================================================
   HELPERS
   ========================================================= */

function formatCompact(
  value: number,
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      notation:
        Math.abs(
          value,
        ) >= 1000
          ? "compact"
          : "standard",

      maximumFractionDigits:
        1,
    },
  ).format(
    value,
  );
}

function formatPercent(
  value: number | null,
) {
  if (
    value === null
  ) {
    return "—";
  }

  const sign =
    value > 0
      ? "+"
      : "";

  return `${sign}${value.toFixed(
    1,
  )}%`;
}

function formatChartDate(
  value: string,
) {
  const date =
    new Date(
      `${value}T00:00:00`,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month:
        "short",

      day:
        "numeric",
    },
  ).format(
    date,
  );
}

function truncate(
  value: string,
  max = 18,
) {
  if (
    value.length <=
    max
  ) {
    return value;
  }

  return `${value.slice(
    0,
    max - 1,
  )}…`;
}

function getRequestedDayCount(
  range: SiteAnalyticsRange,
) {
  switch (
    range
  ) {
    case "30d":
      return 30;

    case "90d":
      return 90;

    default:
      return 7;
  }
}

function getDateKey(
  date: Date,
) {
  return [
    date.getFullYear(),

    String(
      date.getMonth() +
        1,
    ).padStart(
      2,
      "0",
    ),

    String(
      date.getDate(),
    ).padStart(
      2,
      "0",
    ),
  ].join(
    "-",
  );
}

function getTickGap(
  days: number,
) {
  if (
    days > 62
  ) {
    return 55;
  }

  if (
    days > 14
  ) {
    return 38;
  }

  return 20;
}

/* =========================================================
   TRAFFIC DATA

   For normal ranges we fill missing days with 0.

   If a real 90-day range comes back as weekly aggregate
   data, we use the actual returned points instead of
   creating fake zero values between each weekly point.
   ========================================================= */

function buildTrafficData(
  analytics:
    AvailableSiteAnalytics | null,

  days:
    number,
): TrafficPoint[] {
  const trend =
    analytics?.trend ??
    [];

  /*
    Long ranges can be grouped weekly by Vercel.
  */

  if (
    days > 62 &&
    trend.length > 0
  ) {
    return trend.map(
      (
        point,
      ) => ({
        date:
          point.date,

        label:
          formatChartDate(
            point.date,
          ),

        visitors:
          point.visitors ??
          0,

        pageViews:
          point.pageViews ??
          0,
      }),
    );
  }

  /*
    Empty long-range chart:
    create weekly zero points so a graph still exists.
  */

  if (
    days > 62 &&
    trend.length === 0
  ) {
    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0,
    );

    const numberOfWeeks =
      Math.ceil(
        days /
          7,
      );

    const result:
      TrafficPoint[] = [];

    for (
      let index =
        numberOfWeeks -
        1;
      index >= 0;
      index -= 1
    ) {
      const date =
        new Date(
          today,
        );

      date.setDate(
        today.getDate() -
          index *
            7,
      );

      const dateKey =
        getDateKey(
          date,
        );

      result.push({
        date:
          dateKey,

        label:
          formatChartDate(
            dateKey,
          ),

        visitors:
          0,

        pageViews:
          0,
      });
    }

    return result;
  }

  /*
    7D / 30D / fallback range:
    create every single date.
  */

  const realPoints =
    new Map(
      trend.map(
        (
          point,
        ) => [
          point.date,
          point,
        ],
      ),
    );

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0,
  );

  const result:
    TrafficPoint[] = [];

  for (
    let index =
      days -
      1;
    index >= 0;
    index -= 1
  ) {
    const date =
      new Date(
        today,
      );

    date.setDate(
      today.getDate() -
        index,
    );

    const dateKey =
      getDateKey(
        date,
      );

    const realPoint =
      realPoints.get(
        dateKey,
      );

    result.push({
      date:
        dateKey,

      label:
        formatChartDate(
          dateKey,
        ),

      visitors:
        realPoint?.visitors ??
        0,

      pageViews:
        realPoint?.pageViews ??
        0,
    });
  }

  return result;
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function AdminSiteDetails({
  siteId,
}: AdminSiteDetailsProps) {
  const {
    language,
  } = useLanguage();

  const isAm =
    language ===
    "am";

  const [
    site,
    setSite,
  ] =
    useState<
      MonitoredSite | null
    >(
      null,
    );

  const [
    siteLoading,
    setSiteLoading,
  ] =
    useState(
      true,
    );

  const [
    analytics,
    setAnalytics,
  ] =
    useState<
      SiteAnalytics | null
    >(
      null,
    );

  const [
    analyticsLoading,
    setAnalyticsLoading,
  ] =
    useState(
      true,
    );

  const [
    range,
    setRange,
  ] =
    useState<SiteAnalyticsRange>(
      "7d",
    );

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<TabKey>(
      "overview",
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(
      null,
    );

  /* =======================================================
     COPY
     ======================================================= */

  const copy =
    isAm
      ? {
          back:
            "ወደ Sites",

          openSite:
            "Live Site ክፈት",

          overview:
            "Overview",

          analytics:
            "Analytics",

          performance:
            "Performance",

          health:
            "Health",

          settings:
            "Settings",

          visitors:
            "Visitors",

          pageViews:
            "Page Views",

          viewsPerVisitor:
            "Views / Visitor",

          growth:
            "Visitor Growth",

          comparedPrevious:
            "ከቀዳሚው period",

          previousUnavailable:
            "Previous data የለም",

          traffic:
            "Traffic Overview",

          trafficDescription:
            "Visitors እና page views በጊዜ ሂደት።",

          topPages:
            "Top Pages",

          topPagesDescription:
            "በብዛት የታዩ pages።",

          devices:
            "Devices",

          devicesDescription:
            "Page views በdevice type።",

          countries:
            "Top Countries",

          referrers:
            "Traffic Sources",

          noData:
            "Data በመጠበቅ ላይ",

          noPageData:
            "No page data",

          analyticsUnavailable:
            "Analytics ገና አልተገናኘም",

          analyticsSetupDescription:
            "Vercel Project ID፣ access token እና Web Analytics setup ካለቀ በኋላ real traffic data እዚህ ይታያል።",

          integration:
            "Analytics Connection",

          projectId:
            "Project ID",

          teamId:
            "Team ID",

          monitoring:
            "Monitoring",

          enabled:
            "Enabled",

          disabled:
            "Disabled",

          configured:
            "Configured",

          missing:
            "Missing",

          limitedData:
            "Vercel ለዚህ range ያለው data",

          performanceTrend:
            "Performance Trend",

          performanceTrendDescription:
            "Core Web Vitals እና performance history።",

          waitingPerformance:
            "Speed Insights ገና አልተገናኘም",

          responseTime:
            "Response Time",

          responseDescription:
            "Frontend እና API response history።",

          uptimeHistory:
            "Uptime History",

          uptimeDescription:
            "Website availability በጊዜ ሂደት።",

          waitingChecks:
            "Health checks ገና አልተጀመሩም",

          frontend:
            "Frontend",

          backend:
            "Backend",

          uptime:
            "Uptime",

          incidents:
            "Incidents",

          currentStatus:
            "Current Status",

          healthEndpoint:
            "Health Endpoint",

          notChecked:
            "Not checked",

          settingsDescription:
            "Site connection information እና monitoring setup።",

          editSite:
            "Site አስተካክል",

          loading:
            "Site analytics በመጫን ላይ...",
        }
      : {
          back:
            "Back to Sites",

          openSite:
            "Open Live Site",

          overview:
            "Overview",

          analytics:
            "Analytics",

          performance:
            "Performance",

          health:
            "Health",

          settings:
            "Settings",

          visitors:
            "Visitors",

          pageViews:
            "Page Views",

          viewsPerVisitor:
            "Views / Visitor",

          growth:
            "Visitor Growth",

          comparedPrevious:
            "vs previous period",

          previousUnavailable:
            "Previous data unavailable",

          traffic:
            "Traffic Overview",

          trafficDescription:
            "Visitors and page views over time.",

          topPages:
            "Top Pages",

          topPagesDescription:
            "The pages receiving the most traffic.",

          devices:
            "Devices",

          devicesDescription:
            "Page views by device type.",

          countries:
            "Top Countries",

          referrers:
            "Traffic Sources",

          noData:
            "Waiting for data",

          noPageData:
            "No page data",

          analyticsUnavailable:
            "Analytics is not connected yet",

          analyticsSetupDescription:
            "Real traffic will appear here after the Vercel Project ID, access token and Web Analytics tracking are configured.",

          integration:
            "Analytics Connection",

          projectId:
            "Project ID",

          teamId:
            "Team ID",

          monitoring:
            "Monitoring",

          enabled:
            "Enabled",

          disabled:
            "Disabled",

          configured:
            "Configured",

          missing:
            "Missing",

          limitedData:
            "Vercel data available for",

          performanceTrend:
            "Performance Trend",

          performanceTrendDescription:
            "Core Web Vitals and performance history.",

          waitingPerformance:
            "Speed Insights is not connected yet",

          responseTime:
            "Response Time",

          responseDescription:
            "Frontend and API response history.",

          uptimeHistory:
            "Uptime History",

          uptimeDescription:
            "Website availability over time.",

          waitingChecks:
            "Health checks have not started yet",

          frontend:
            "Frontend",

          backend:
            "Backend",

          uptime:
            "Uptime",

          incidents:
            "Incidents",

          currentStatus:
            "Current Status",

          healthEndpoint:
            "Health Endpoint",

          notChecked:
            "Not checked",

          settingsDescription:
            "Site connection information and monitoring configuration.",

          editSite:
            "Edit Site",

          loading:
            "Loading site analytics...",
        };

  /* =======================================================
     LOAD SITE
     ======================================================= */

  useEffect(() => {
    let cancelled =
      false;

    async function load() {
      setSiteLoading(
        true,
      );

      setError(
        null,
      );

      try {
        const result =
          await getSite(
            siteId,
            language,
          );

        if (
          cancelled
        ) {
          return;
        }

        setSite(
          result,
        );
      } catch (
        loadError
      ) {
        if (
          cancelled
        ) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load site.",
        );
      } finally {
        if (
          !cancelled
        ) {
          setSiteLoading(
            false,
          );
        }
      }
    }

    void load();

    return () => {
      cancelled =
        true;
    };
  }, [
    siteId,
    language,
  ]);

  /* =======================================================
     LOAD ANALYTICS
     ======================================================= */

  useEffect(() => {
    let cancelled =
      false;

    async function load() {
      setAnalyticsLoading(
        true,
      );

      setError(
        null,
      );

      try {
        const result =
          await getSiteAnalytics(
            siteId,
            range,
            language,
          );

        if (
          cancelled
        ) {
          return;
        }

        setAnalytics(
          result,
        );
      } catch (
        loadError
      ) {
        if (
          cancelled
        ) {
          return;
        }

        setAnalytics(
          null,
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load analytics.",
        );
      } finally {
        if (
          !cancelled
        ) {
          setAnalyticsLoading(
            false,
          );
        }
      }
    }

    void load();

    return () => {
      cancelled =
        true;
    };
  }, [
    siteId,
    range,
    language,
  ]);

  /* =======================================================
     AVAILABLE ANALYTICS
     ======================================================= */

  const analyticsData:
    AvailableSiteAnalytics | null =
      analytics?.available
        ? analytics
        : null;

  /* =======================================================
     EFFECTIVE RANGE

     If 90D was selected but Hobby only gives 30D:
     graph gets 30 real days, not 60 fake zero days.
     ======================================================= */

  const effectiveDayCount =
    analyticsData?.effectiveDays ??
    getRequestedDayCount(
      range,
    );

  /* =======================================================
     TRAFFIC DATA
     ======================================================= */

  const trafficData =
    useMemo(
      () =>
        buildTrafficData(
          analyticsData,
          effectiveDayCount,
        ),
      [
        analyticsData,
        effectiveDayCount,
      ],
    );

  /* =======================================================
     ZERO DATA FOR PERFORMANCE / HEALTH
     ======================================================= */

  const placeholderTrend =
    useMemo<
      PlaceholderTrendPoint[]
    >(
      () =>
        trafficData.map(
          (
            point,
          ) => ({
            ...point,

            performance:
              0,

            responseTime:
              0,

            uptime:
              0,
          }),
        ),
      [
        trafficData,
      ],
    );

  /* =======================================================
     TRAFFIC SCALE
     ======================================================= */

  const trafficYAxisMax =
    useMemo(
      () => {
        const highest =
          Math.max(
            0,
            ...trafficData.flatMap(
              (
                point,
              ) => [
                point.visitors,
                point.pageViews,
              ],
            ),
          );

        if (
          highest ===
          0
        ) {
          return 100;
        }

        if (
          highest <=
          10
        ) {
          return 10;
        }

        if (
          highest <=
          25
        ) {
          return 25;
        }

        if (
          highest <=
          50
        ) {
          return 50;
        }

        if (
          highest <=
          100
        ) {
          return 100;
        }

        return Math.ceil(
          highest *
            1.15,
        );
      },
      [
        trafficData,
      ],
    );

  /* =======================================================
     DEVICES

     Device aggregate uses PAGE VIEWS.
     ======================================================= */

  const deviceData =
    useMemo(
      () =>
        analyticsData?.devices
          .filter(
            (
              item,
            ) =>
              item.pageViews >
              0,
          )
          .slice(
            0,
            6,
          )
          .map(
            (
              item,
              index,
            ) => ({
              device:
                item.name,

              pageViews:
                item.pageViews,

              fill:
                DEVICE_COLORS[
                  index %
                    DEVICE_COLORS.length
                ],
            }),
          ) ??
        [],
      [
        analyticsData,
      ],
    );

  const devicePageViewsTotal =
    useMemo(
      () =>
        deviceData.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.pageViews,
          0,
        ),
      [
        deviceData,
      ],
    );

  /*
    A Pie with 0 cannot draw a circle.

    This single value is ONLY the neutral empty shell.
    The visible real value in the center remains 0.
  */

  const displayedDeviceData =
    useMemo(
      () => {
        if (
          deviceData.length >
          0
        ) {
          return deviceData;
        }

        return [
          {
            device:
              copy.noData,

            pageViews:
              1,

            fill:
              "#edf1e9",
          },
        ];
      },
      [
        deviceData,
        copy.noData,
      ],
    );

  /* =======================================================
     TOP PAGES
     ======================================================= */

  const displayedTopPages =
    useMemo(
      () => {
        if (
          analyticsData?.topPages.length
        ) {
          return analyticsData.topPages;
        }

        return [
          {
            name:
              copy.noPageData,

            visitors:
              0,

            pageViews:
              0,
          },
        ];
      },
      [
        analyticsData,
        copy.noPageData,
      ],
    );

  /* =======================================================
     CHART CONFIG
     ======================================================= */

  const trafficConfig:
    ChartConfig = {
      visitors: {
        label:
          copy.visitors,

        color:
          "#426c2b",
      },

      pageViews: {
        label:
          copy.pageViews,

        color:
          "#a2c78a",
      },
    };

  const pagesConfig:
    ChartConfig = {
      pageViews: {
        label:
          copy.pageViews,

        color:
          "#426c2b",
      },
    };

  const deviceConfig:
    ChartConfig = {
      pageViews: {
        label:
          copy.pageViews,

        color:
          "#426c2b",
      },
    };

  const performanceConfig:
    ChartConfig = {
      performance: {
        label:
          copy.performance,

        color:
          "#426c2b",
      },
    };

  const responseConfig:
    ChartConfig = {
      responseTime: {
        label:
          copy.responseTime,

        color:
          "#426c2b",
      },
    };

  const uptimeConfig:
    ChartConfig = {
      uptime: {
        label:
          copy.uptime,

        color:
          "#80c93c",
      },
    };

  /* =======================================================
     LOADING SITE
     ======================================================= */

  if (
    siteLoading
  ) {
    return (
      <div className="flex min-h-[520px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-black/[0.08] border-t-[#426c2b]" />

          <span className="text-[9px] font-semibold text-black/35">
            {
              copy.loading
            }
          </span>
        </div>
      </div>
    );
  }

  if (
    !site
  ) {
    return (
      <div className="rounded-[22px] border border-red-100 bg-red-50 p-6">
        <p className="text-sm text-red-600">
          {error ??
            "Site not found."}
        </p>
      </div>
    );
  }

  /* =======================================================
     TABS
     ======================================================= */

  const tabs: {
    key:
      TabKey;

    label:
      string;

    icon:
      ReactNode;
  }[] = [
    {
      key:
        "overview",

      label:
        copy.overview,

      icon:
        <GlobeIcon />,
    },

    {
      key:
        "analytics",

      label:
        copy.analytics,

      icon:
        <ChartIcon />,
    },

    {
      key:
        "performance",

      label:
        copy.performance,

      icon:
        <SpeedIcon />,
    },

    {
      key:
        "health",

      label:
        copy.health,

      icon:
        <PulseIcon />,
    },

    {
      key:
        "settings",

      label:
        copy.settings,

      icon:
        <SettingsIcon />,
    },
  ];

  const analyticsUnavailable =
    !analyticsLoading &&
    analytics &&
    !analytics.available;

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="pb-10">
      {/* =================================================
          BACK
         ================================================= */}

      <Link
        href="/admin/sites"
        className="mb-4 inline-flex items-center gap-2 text-[8px] font-bold text-black/35 transition hover:text-[#426c2b]"
      >
        <span className="h-4 w-4">
          <ArrowLeftIcon />
        </span>

        {
          copy.back
        }
      </Link>

      {/* =================================================
          HERO
         ================================================= */}

      <section className="overflow-hidden rounded-[26px] border border-black/[0.055] bg-[radial-gradient(circle_at_92%_0%,rgba(128,201,60,0.11),transparent_32%),linear-gradient(135deg,#ffffff,#f5f8f1)] p-6 shadow-[0_12px_40px_rgba(39,53,30,0.035)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#edf5e7] text-[#507d33]">
                <span className="h-5 w-5">
                  <GlobeIcon />
                </span>
              </span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-[25px] font-black tracking-[-0.05em] text-[#171b15] sm:text-[32px]">
                    {
                      site.name
                    }
                  </h2>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[6.5px] font-extrabold uppercase tracking-[0.1em] ${
                      site.monitoringEnabled
                        ? "bg-[#eaf5e4] text-[#507d33]"
                        : "bg-black/[0.045] text-black/35"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        site.monitoringEnabled
                          ? "bg-[#80c93c]"
                          : "bg-black/20"
                      }`}
                    />

                    {site.monitoringEnabled
                      ? copy.enabled
                      : copy.disabled}
                  </span>
                </div>

                <p className="mt-1 truncate text-[8.5px] text-black/32">
                  {
                    site.frontendUrl
                  }
                </p>

                {analyticsData?.limited &&
                  analyticsData.limitedToDays && (
                    <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[6.5px] font-bold text-amber-600">
                      {copy.limitedData}{" "}
                      {
                        analyticsData.limitedToDays
                      }
                      D
                    </span>
                  )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* RANGE */}

            <div className="flex items-center rounded-xl border border-black/[0.06] bg-white p-1 shadow-sm">
              {(
                [
                  "7d",
                  "30d",
                  "90d",
                ] as SiteAnalyticsRange[]
              ).map(
                (
                  item,
                ) => (
                  <button
                    key={
                      item
                    }
                    type="button"
                    disabled={
                      analyticsLoading
                    }
                    onClick={() =>
                      setRange(
                        item,
                      )
                    }
                    className={`rounded-lg px-3 py-2 text-[7.5px] font-extrabold uppercase transition ${
                      range ===
                      item
                        ? "bg-[#edf5e7] text-[#426c2b]"
                        : "text-black/30 hover:text-black/55"
                    } disabled:cursor-wait disabled:opacity-45`}
                  >
                    {
                      item
                    }
                  </button>
                ),
              )}
            </div>

            {/* LIVE SITE */}

            <a
              href={
                site.frontendUrl
              }
              target="_blank"
              rel="noreferrer"
              className="flex h-10 items-center gap-2 rounded-xl bg-[#426c2b] px-4 text-[8px] font-bold text-white shadow-[0_10px_25px_rgba(66,108,43,0.16)] transition hover:bg-[#315a1f]"
            >
              {
                copy.openSite
              }

              <span className="h-3.5 w-3.5">
                <ExternalIcon />
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* =================================================
          TABS
         ================================================= */}

      <div className="mt-5 overflow-x-auto rounded-[16px] border border-black/[0.055] bg-white p-1.5 shadow-[0_5px_18px_rgba(36,49,28,0.02)]">
        <div className="flex min-w-max items-center gap-1">
          {tabs.map(
            (
              tab,
            ) => {
              const active =
                activeTab ===
                tab.key;

              return (
                <button
                  key={
                    tab.key
                  }
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      tab.key,
                    )
                  }
                  className={`flex h-9 items-center gap-2 rounded-xl px-4 text-[8px] font-bold transition ${
                    active
                      ? "bg-[#edf5e7] text-[#426c2b]"
                      : "text-black/35 hover:bg-black/[0.025] hover:text-black/60"
                  }`}
                >
                  <span className="h-3.5 w-3.5">
                    {
                      tab.icon
                    }
                  </span>

                  {
                    tab.label
                  }
                </button>
              );
            },
          )}
        </div>
      </div>

      {/* =================================================
          ERROR
         ================================================= */}

      {error && (
        <div className="mt-4 flex items-center gap-3 rounded-[15px] border border-red-100 bg-red-50 p-4">
          <span className="h-4 w-4 shrink-0 text-red-500">
            <WarningIcon />
          </span>

          <p className="text-[8.5px] text-red-600">
            {
              error
            }
          </p>
        </div>
      )}

      {/* =================================================
          OVERVIEW / ANALYTICS
         ================================================= */}

      {(activeTab ===
        "overview" ||
        activeTab ===
          "analytics") && (
        <>
          {/* ===============================================
              METRICS
             =============================================== */}

          <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label={
                copy.visitors
              }
              value={
                analyticsData
                  ? formatCompact(
                      analyticsData
                        .totals
                        .visitors,
                    )
                  : "0"
              }
              icon={
                <UsersIcon />
              }
              change={
                analyticsData
                  ? analyticsData
                      .totals
                      .visitorChange
                  : 0
              }
              sublabel={
                analyticsData &&
                !analyticsData.comparisonAvailable
                  ? copy.previousUnavailable
                  : copy.comparedPrevious
              }
            />

            <MetricCard
              label={
                copy.pageViews
              }
              value={
                analyticsData
                  ? formatCompact(
                      analyticsData
                        .totals
                        .pageViews,
                    )
                  : "0"
              }
              icon={
                <EyeIcon />
              }
              change={
                analyticsData
                  ? analyticsData
                      .totals
                      .pageViewChange
                  : 0
              }
              sublabel={
                analyticsData &&
                !analyticsData.comparisonAvailable
                  ? copy.previousUnavailable
                  : copy.comparedPrevious
              }
            />

            <MetricCard
              label={
                copy.viewsPerVisitor
              }
              value={
                analyticsData
                  ? analyticsData
                      .totals
                      .viewsPerVisitor
                      .toFixed(
                        2,
                      )
                  : "0.00"
              }
              icon={
                <ChartIcon />
              }
            />

            <MetricCard
              label={
                copy.growth
              }
              value={
                analyticsData
                  ? formatPercent(
                      analyticsData
                        .totals
                        .visitorChange,
                    )
                  : "0.0%"
              }
              icon={
                <TrendingIcon
                  down={
                    Boolean(
                      analyticsData &&
                        analyticsData
                          .totals
                          .visitorChange !==
                          null &&
                        analyticsData
                          .totals
                          .visitorChange <
                          0,
                    )
                  }
                />
              }
            />
          </section>

          {/* ===============================================
              ANALYTICS NOT CONNECTED
             =============================================== */}

          {analyticsUnavailable && (
            <section className="mt-5 flex min-h-[220px] flex-col items-center justify-center rounded-[24px] border border-dashed border-black/[0.09] bg-white px-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf5e7] text-[#507d33]">
                <span className="h-5 w-5">
                  <ChartIcon />
                </span>
              </span>

              <h3 className="mt-4 text-[14px] font-bold text-[#20251d]">
                {
                  copy.analyticsUnavailable
                }
              </h3>

              <p className="mt-2 max-w-[500px] text-[8px] leading-5 text-black/38">
                {analytics &&
                !analytics.available
                  ? analytics
                      .message[
                      language
                    ]
                  : copy.analyticsSetupDescription}
              </p>
            </section>
          )}

          {/* ===============================================
              ANALYTICS LOADING
             =============================================== */}

          {analyticsLoading && (
            <section className="mt-5 flex h-[180px] items-center justify-center rounded-[23px] border border-black/[0.055] bg-white">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/[0.08] border-t-[#426c2b]" />
            </section>
          )}

          {/* ===============================================
              ANALYTICS CONTENT
             =============================================== */}

          {!analyticsLoading &&
            analyticsData && (
              <>
                {/* ===========================================
                    TRAFFIC + DEVICES
                   =========================================== */}

                <section className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
                  {/* =========================================
                      TRAFFIC
                     ========================================= */}

                  <article className="overflow-hidden rounded-[23px] border border-black/[0.055] bg-white p-5 shadow-[0_8px_30px_rgba(32,45,25,0.025)] sm:p-6">
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-[12px] font-extrabold text-[#20251d]">
                          {
                            copy.traffic
                          }
                        </h3>

                        <p className="mt-1 text-[7.5px] text-black/30">
                          {
                            copy.trafficDescription
                          }
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <LegendDot
                          color="#426c2b"
                          label={
                            copy.visitors
                          }
                        />

                        <LegendDot
                          color="#a2c78a"
                          label={
                            copy.pageViews
                          }
                        />
                      </div>
                    </div>

                    <ChartContainer
                      config={
                        trafficConfig
                      }
                      className="h-[300px] w-full"
                    >
                      <AreaChart
                        accessibilityLayer
                        data={
                          trafficData
                        }
                        margin={{
                          top:
                            10,

                          right:
                            12,

                          bottom:
                            0,

                          left:
                            0,
                        }}
                      >
                        <defs>
                          <linearGradient
                            id="siteVisitorsGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="var(--color-visitors)"
                              stopOpacity={
                                0.28
                              }
                            />

                            <stop
                              offset="95%"
                              stopColor="var(--color-visitors)"
                              stopOpacity={
                                0
                              }
                            />
                          </linearGradient>

                          <linearGradient
                            id="sitePageViewsGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="var(--color-pageViews)"
                              stopOpacity={
                                0.2
                              }
                            />

                            <stop
                              offset="95%"
                              stopColor="var(--color-pageViews)"
                              stopOpacity={
                                0
                              }
                            />
                          </linearGradient>
                        </defs>

                        <CartesianGrid
                          vertical={
                            false
                          }
                          stroke="rgba(0,0,0,0.065)"
                        />

                        <XAxis
                          dataKey="label"
                          tickLine={
                            false
                          }
                          axisLine={
                            false
                          }
                          tickMargin={
                            12
                          }
                          minTickGap={
                            getTickGap(
                              effectiveDayCount,
                            )
                          }
                          tick={{
                            fontSize:
                              8,

                            fill:
                              "rgba(0,0,0,0.30)",
                          }}
                        />

                        <YAxis
                          domain={[
                            0,
                            trafficYAxisMax,
                          ]}
                          tickLine={
                            false
                          }
                          axisLine={
                            false
                          }
                          tickCount={
                            3
                          }
                          allowDecimals={
                            false
                          }
                          width={
                            34
                          }
                          tick={{
                            fontSize:
                              8,

                            fill:
                              "rgba(0,0,0,0.30)",
                          }}
                          tickFormatter={(
                            value,
                          ) =>
                            formatCompact(
                              Number(
                                value,
                              ),
                            )
                          }
                        />

                        <ReferenceLine
                          y={
                            0
                          }
                          stroke="rgba(66,108,43,0.32)"
                          strokeWidth={
                            1.25
                          }
                        />

                        <ChartTooltip
                          cursor={{
                            stroke:
                              "rgba(66,108,43,0.16)",

                            strokeWidth:
                              1,
                          }}
                          content={
                            <ChartTooltipContent
                              indicator="dot"
                            />
                          }
                        />

                        <Area
                          type="monotone"
                          dataKey="pageViews"
                          stroke="var(--color-pageViews)"
                          fill="url(#sitePageViewsGradient)"
                          strokeWidth={
                            2
                          }
                          dot={
                            false
                          }
                          activeDot={{
                            r:
                              4,
                          }}
                        />

                        <Area
                          type="monotone"
                          dataKey="visitors"
                          stroke="var(--color-visitors)"
                          fill="url(#siteVisitorsGradient)"
                          strokeWidth={
                            2.4
                          }
                          dot={
                            false
                          }
                          activeDot={{
                            r:
                              4,
                          }}
                        />
                      </AreaChart>
                    </ChartContainer>
                  </article>

                  {/* =========================================
                      DEVICES
                     ========================================= */}

                  <article className="rounded-[23px] border border-black/[0.055] bg-white p-5 shadow-[0_8px_30px_rgba(32,45,25,0.025)] sm:p-6">
                    <h3 className="text-[12px] font-extrabold text-[#20251d]">
                      {
                        copy.devices
                      }
                    </h3>

                    <p className="mt-1 text-[7.5px] text-black/30">
                      {
                        copy.devicesDescription
                      }
                    </p>

                    <div className="relative mt-2">
                      <ChartContainer
                        config={
                          deviceConfig
                        }
                        className="mx-auto h-[215px] w-full"
                      >
                        <PieChart>
                          {deviceData.length >
                            0 && (
                            <ChartTooltip
                              cursor={
                                false
                              }
                              content={
                                <ChartTooltipContent
                                  hideLabel
                                />
                              }
                            />
                          )}

                          <Pie
                            data={
                              displayedDeviceData
                            }
                            dataKey="pageViews"
                            nameKey="device"
                            innerRadius={
                              58
                            }
                            outerRadius={
                              80
                            }
                            paddingAngle={
                              deviceData.length >
                              0
                                ? 2
                                : 0
                            }
                            strokeWidth={
                              0
                            }
                            isAnimationActive={
                              deviceData.length >
                              0
                            }
                          />
                        </PieChart>
                      </ChartContainer>

                      {/* CENTER VALUE */}

                      <div className="pointer-events-none absolute inset-x-0 top-[82px] flex flex-col items-center">
                        <strong className="text-[20px] font-black tracking-[-0.04em] text-[#20251d]">
                          {formatCompact(
                            devicePageViewsTotal,
                          )}
                        </strong>

                        <span className="mt-0.5 text-[6.5px] font-bold uppercase tracking-[0.1em] text-black/25">
                          {
                            copy.pageViews
                          }
                        </span>
                      </div>
                    </div>

                    {/* DEVICE LIST */}

                    {deviceData.length >
                    0 ? (
                      <div className="mt-1 space-y-2">
                        {deviceData.map(
                          (
                            device,
                          ) => (
                            <div
                              key={
                                device.device
                              }
                              className="flex items-center justify-between gap-4"
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <span
                                  className="h-2 w-2 shrink-0 rounded-full"
                                  style={{
                                    background:
                                      device.fill,
                                  }}
                                />

                                <span className="truncate text-[8px] font-medium text-black/44">
                                  {
                                    device.device
                                  }
                                </span>
                              </div>

                              <strong className="text-[8px] font-bold text-[#252b21]">
                                {formatCompact(
                                  device.pageViews,
                                )}
                              </strong>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <p className="mt-1 text-center text-[7.5px] text-black/27">
                        {
                          copy.noData
                        }
                      </p>
                    )}
                  </article>
                </section>

                {/* ===========================================
                    TOP PAGES + CONNECTION
                   =========================================== */}

                <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
                  {/* =========================================
                      TOP PAGES
                     ========================================= */}

                  <article className="rounded-[23px] border border-black/[0.055] bg-white p-5 shadow-[0_8px_30px_rgba(32,45,25,0.025)] sm:p-6">
                    <h3 className="text-[12px] font-extrabold text-[#20251d]">
                      {
                        copy.topPages
                      }
                    </h3>

                    <p className="mt-1 text-[7.5px] text-black/30">
                      {
                        copy.topPagesDescription
                      }
                    </p>

                    <div className="relative mt-5">
                      <ChartContainer
                        config={
                          pagesConfig
                        }
                        className="h-[300px] w-full"
                      >
                        <BarChart
                          accessibilityLayer
                          data={
                            displayedTopPages
                          }
                          layout="vertical"
                          margin={{
                            top:
                              8,

                            right:
                              18,

                            bottom:
                              8,

                            left:
                              4,
                          }}
                        >
                          <CartesianGrid
                            horizontal={
                              false
                            }
                            stroke="rgba(0,0,0,0.055)"
                          />

                          <XAxis
                            type="number"
                            domain={
                              analyticsData
                                .topPages
                                .length >
                              0
                                ? [
                                    0,
                                    "auto",
                                  ]
                                : [
                                    0,
                                    100,
                                  ]
                            }
                            tickLine={
                              false
                            }
                            axisLine={
                              false
                            }
                            tickCount={
                              3
                            }
                            allowDecimals={
                              false
                            }
                            tick={{
                              fontSize:
                                8,

                              fill:
                                "rgba(0,0,0,0.28)",
                            }}
                          />

                          <YAxis
                            dataKey="name"
                            type="category"
                            tickLine={
                              false
                            }
                            axisLine={
                              false
                            }
                            width={
                              125
                            }
                            tick={{
                              fontSize:
                                8,

                              fill:
                                "rgba(0,0,0,0.36)",
                            }}
                            tickFormatter={(
                              value,
                            ) =>
                              truncate(
                                String(
                                  value,
                                ),
                                21,
                              )
                            }
                          />

                          <ReferenceLine
                            x={
                              0
                            }
                            stroke="rgba(66,108,43,0.28)"
                          />

                          {analyticsData
                            .topPages
                            .length >
                            0 && (
                            <ChartTooltip
                              cursor={{
                                fill:
                                  "rgba(66,108,43,0.035)",
                              }}
                              content={
                                <ChartTooltipContent
                                  hideLabel
                                />
                              }
                            />
                          )}

                          <Bar
                            dataKey="pageViews"
                            fill="var(--color-pageViews)"
                            radius={[
                              0,
                              6,
                              6,
                              0,
                            ]}
                          />
                        </BarChart>
                      </ChartContainer>

                      {analyticsData
                        .topPages
                        .length ===
                        0 && (
                        <div className="pointer-events-none absolute right-4 top-3 rounded-lg bg-white/85 px-2.5 py-1.5 text-[7px] font-semibold text-black/25 backdrop-blur-sm">
                          0 views
                        </div>
                      )}
                    </div>
                  </article>

                  {/* =========================================
                      ANALYTICS CONNECTION
                     ========================================= */}

                  <article className="rounded-[23px] border border-black/[0.055] bg-white p-5 shadow-[0_8px_30px_rgba(32,45,25,0.025)] sm:p-6">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                        <span className="text-[11px]">
                          ▲
                        </span>
                      </span>

                      <div>
                        <h3 className="text-[11px] font-extrabold text-[#20251d]">
                          {
                            copy.integration
                          }
                        </h3>

                        <p className="mt-0.5 text-[7px] text-black/28">
                          Vercel Web Analytics
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      <ConnectionRow
                        label={
                          copy.projectId
                        }
                        value={
                          site.vercelProjectId
                        }
                        configured={
                          Boolean(
                            site.vercelProjectId,
                          )
                        }
                        yes={
                          copy.configured
                        }
                        no={
                          copy.missing
                        }
                      />

                      <ConnectionRow
                        label={
                          copy.teamId
                        }
                        value={
                          site.vercelTeamId
                        }
                        configured={
                          Boolean(
                            site.vercelTeamId,
                          )
                        }
                        yes={
                          copy.configured
                        }
                        no={
                          copy.missing
                        }
                      />

                      <ConnectionRow
                        label={
                          copy.analytics
                        }
                        configured={
                          site.analyticsEnabled
                        }
                        yes={
                          copy.enabled
                        }
                        no={
                          copy.disabled
                        }
                      />

                      <ConnectionRow
                        label={
                          copy.monitoring
                        }
                        configured={
                          site.monitoringEnabled
                        }
                        yes={
                          copy.enabled
                        }
                        no={
                          copy.disabled
                        }
                      />
                    </div>
                  </article>
                </section>

                {/* ===========================================
                    ANALYTICS TAB
                   =========================================== */}

                {activeTab ===
                  "analytics" && (
                  <section className="mt-4 grid gap-4 lg:grid-cols-2">
                    <RankedCard
                      title={
                        copy.countries
                      }
                      items={
                        analyticsData.countries
                      }
                      emptyText={
                        copy.noData
                      }
                    />

                    <RankedCard
                      title={
                        copy.referrers
                      }
                      items={
                        analyticsData.referrers
                      }
                      emptyText={
                        copy.noData
                      }
                    />
                  </section>
                )}
              </>
            )}
        </>
      )}

      {/* =================================================
          PERFORMANCE
         ================================================= */}

      {activeTab ===
        "performance" && (
        <>
          <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="LCP"
              value="0ms"
              icon={
                <SpeedIcon />
              }
            />

            <MetricCard
              label="INP"
              value="0ms"
              icon={
                <PulseIcon />
              }
            />

            <MetricCard
              label="CLS"
              value="0.000"
              icon={
                <ChartIcon />
              }
            />

            <MetricCard
              label="Performance Score"
              value="0"
              icon={
                <TrendingIcon />
              }
            />
          </section>

          <section className="mt-4 rounded-[23px] border border-black/[0.055] bg-white p-5 shadow-[0_8px_30px_rgba(32,45,25,0.025)] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-[12px] font-extrabold text-[#20251d]">
                  {
                    copy.performanceTrend
                  }
                </h3>

                <p className="mt-1 text-[7.5px] text-black/30">
                  {
                    copy.performanceTrendDescription
                  }
                </p>
              </div>

              <span className="rounded-full bg-[#f1f5ed] px-2.5 py-1 text-[6.5px] font-bold text-black/30">
                {
                  copy.waitingPerformance
                }
              </span>
            </div>

            <ChartContainer
              config={
                performanceConfig
              }
              className="mt-5 h-[320px] w-full"
            >
              <AreaChart
                accessibilityLayer
                data={
                  placeholderTrend
                }
                margin={{
                  top:
                    10,

                  right:
                    12,

                  left:
                    0,
                }}
              >
                <CartesianGrid
                  vertical={
                    false
                  }
                  stroke="rgba(0,0,0,0.06)"
                />

                <XAxis
                  dataKey="label"
                  tickLine={
                    false
                  }
                  axisLine={
                    false
                  }
                  minTickGap={
                    getTickGap(
                      effectiveDayCount,
                    )
                  }
                  tick={{
                    fontSize:
                      8,

                    fill:
                      "rgba(0,0,0,0.28)",
                  }}
                />

                <YAxis
                  domain={[
                    0,
                    100,
                  ]}
                  tickLine={
                    false
                  }
                  axisLine={
                    false
                  }
                  tickCount={
                    3
                  }
                  width={
                    34
                  }
                  allowDecimals={
                    false
                  }
                  tick={{
                    fontSize:
                      8,

                    fill:
                      "rgba(0,0,0,0.28)",
                  }}
                />

                <ReferenceLine
                  y={
                    0
                  }
                  stroke="rgba(66,108,43,0.30)"
                />

                <ChartTooltip
                  content={
                    <ChartTooltipContent />
                  }
                />

                <Area
                  type="monotone"
                  dataKey="performance"
                  stroke="var(--color-performance)"
                  fill="transparent"
                  strokeWidth={
                    2.2
                  }
                  dot={
                    false
                  }
                />
              </AreaChart>
            </ChartContainer>
          </section>
        </>
      )}

      {/* =================================================
          HEALTH
         ================================================= */}

      {activeTab ===
        "health" && (
        <>
          <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label={
                copy.frontend
              }
              value="0ms"
              icon={
                <GlobeIcon />
              }
            />

            <MetricCard
              label={
                copy.backend
              }
              value="0ms"
              icon={
                <PulseIcon />
              }
            />

            <MetricCard
              label={
                copy.uptime
              }
              value="0%"
              icon={
                <ChartIcon />
              }
            />

            <MetricCard
              label={
                copy.incidents
              }
              value="0"
              icon={
                <WarningIcon />
              }
            />
          </section>

          {/* ===============================================
              RESPONSE TIME
             =============================================== */}

          <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.65fr)]">
            <article className="rounded-[23px] border border-black/[0.055] bg-white p-5 shadow-[0_8px_30px_rgba(32,45,25,0.025)] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-[12px] font-extrabold text-[#20251d]">
                    {
                      copy.responseTime
                    }
                  </h3>

                  <p className="mt-1 text-[7.5px] text-black/30">
                    {
                      copy.responseDescription
                    }
                  </p>
                </div>

                <span className="rounded-full bg-[#f1f5ed] px-2.5 py-1 text-[6.5px] font-bold text-black/30">
                  {
                    copy.waitingChecks
                  }
                </span>
              </div>

              <ChartContainer
                config={
                  responseConfig
                }
                className="mt-5 h-[300px] w-full"
              >
                <AreaChart
                  accessibilityLayer
                  data={
                    placeholderTrend
                  }
                  margin={{
                    top:
                      10,

                    right:
                      12,

                    left:
                      0,
                  }}
                >
                  <CartesianGrid
                    vertical={
                      false
                    }
                    stroke="rgba(0,0,0,0.06)"
                  />

                  <XAxis
                    dataKey="label"
                    tickLine={
                      false
                    }
                    axisLine={
                      false
                    }
                    minTickGap={
                      getTickGap(
                        effectiveDayCount,
                      )
                    }
                    tick={{
                      fontSize:
                        8,

                      fill:
                        "rgba(0,0,0,0.28)",
                    }}
                  />

                  <YAxis
                    domain={[
                      0,
                      1000,
                    ]}
                    tickLine={
                      false
                    }
                    axisLine={
                      false
                    }
                    tickCount={
                      3
                    }
                    width={
                      45
                    }
                    allowDecimals={
                      false
                    }
                    tickFormatter={(
                      value,
                    ) =>
                      `${value}ms`
                    }
                    tick={{
                      fontSize:
                        8,

                      fill:
                        "rgba(0,0,0,0.28)",
                    }}
                  />

                  <ReferenceLine
                    y={
                      0
                    }
                    stroke="rgba(66,108,43,0.30)"
                  />

                  <ChartTooltip
                    content={
                      <ChartTooltipContent />
                    }
                  />

                  <Area
                    type="monotone"
                    dataKey="responseTime"
                    stroke="var(--color-responseTime)"
                    fill="transparent"
                    strokeWidth={
                      2.2
                    }
                    dot={
                      false
                    }
                  />
                </AreaChart>
              </ChartContainer>
            </article>

            {/* =============================================
                CURRENT STATUS
               ============================================= */}

            <article className="rounded-[23px] border border-black/[0.055] bg-white p-5 shadow-[0_8px_30px_rgba(32,45,25,0.025)] sm:p-6">
              <h3 className="text-[12px] font-extrabold text-[#20251d]">
                {
                  copy.currentStatus
                }
              </h3>

              <p className="mt-1 text-[7.5px] text-black/30">
                {
                  copy.waitingChecks
                }
              </p>

              <div className="mt-6 space-y-3">
                <StatusRow
                  label={
                    copy.frontend
                  }
                  value={
                    copy.notChecked
                  }
                />

                <StatusRow
                  label={
                    copy.backend
                  }
                  value={
                    copy.notChecked
                  }
                />

                <ConnectionRow
                  label={
                    copy.healthEndpoint
                  }
                  value={
                    site.healthUrl
                  }
                  configured={
                    Boolean(
                      site.healthUrl,
                    )
                  }
                  yes={
                    copy.configured
                  }
                  no={
                    copy.missing
                  }
                />
              </div>
            </article>
          </section>

          {/* ===============================================
              UPTIME
             =============================================== */}

          <section className="mt-4 rounded-[23px] border border-black/[0.055] bg-white p-5 shadow-[0_8px_30px_rgba(32,45,25,0.025)] sm:p-6">
            <div>
              <h3 className="text-[12px] font-extrabold text-[#20251d]">
                {
                  copy.uptimeHistory
                }
              </h3>

              <p className="mt-1 text-[7.5px] text-black/30">
                {
                  copy.uptimeDescription
                }
              </p>
            </div>

            <ChartContainer
              config={
                uptimeConfig
              }
              className="mt-5 h-[260px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={
                  placeholderTrend
                }
                margin={{
                  top:
                    10,

                  right:
                    12,

                  left:
                    0,
                }}
              >
                <CartesianGrid
                  vertical={
                    false
                  }
                  stroke="rgba(0,0,0,0.06)"
                />

                <XAxis
                  dataKey="label"
                  tickLine={
                    false
                  }
                  axisLine={
                    false
                  }
                  minTickGap={
                    getTickGap(
                      effectiveDayCount,
                    )
                  }
                  tick={{
                    fontSize:
                      8,

                    fill:
                      "rgba(0,0,0,0.28)",
                  }}
                />

                <YAxis
                  domain={[
                    0,
                    100,
                  ]}
                  tickLine={
                    false
                  }
                  axisLine={
                    false
                  }
                  tickCount={
                    3
                  }
                  width={
                    40
                  }
                  tickFormatter={(
                    value,
                  ) =>
                    `${value}%`
                  }
                  tick={{
                    fontSize:
                      8,

                    fill:
                      "rgba(0,0,0,0.28)",
                  }}
                />

                <ReferenceLine
                  y={
                    0
                  }
                  stroke="rgba(66,108,43,0.30)"
                />

                <ChartTooltip
                  content={
                    <ChartTooltipContent />
                  }
                />

                <Bar
                  dataKey="uptime"
                  fill="var(--color-uptime)"
                  radius={[
                    4,
                    4,
                    0,
                    0,
                  ]}
                />
              </BarChart>
            </ChartContainer>
          </section>
        </>
      )}

      {/* =================================================
          SETTINGS
         ================================================= */}

      {activeTab ===
        "settings" && (
        <section className="mt-5 rounded-[23px] border border-black/[0.055] bg-white p-5 shadow-[0_8px_30px_rgba(32,45,25,0.025)] sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-[14px] font-extrabold text-[#20251d]">
                {
                  copy.settings
                }
              </h3>

              <p className="mt-1 text-[8px] text-black/32">
                {
                  copy.settingsDescription
                }
              </p>
            </div>

            <Link
              href="/admin/sites"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#426c2b] px-4 text-[8px] font-bold text-white transition hover:bg-[#315a1f]"
            >
              {
                copy.editSite
              }
            </Link>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-3">
            <InfoCard
              label={
                copy.frontend
              }
              value={
                site.frontendUrl
              }
            />

            <InfoCard
              label={
                copy.backend
              }
              value={
                site.backendUrl ??
                "—"
              }
            />

            <InfoCard
              label={
                copy.healthEndpoint
              }
              value={
                site.healthUrl ??
                "—"
              }
            />
          </div>
        </section>
      )}
    </div>
  );
}

/* =========================================================
   METRIC CARD
   ========================================================= */

function MetricCard({
  label,
  value,
  icon,
  change,
  sublabel,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  change?: number | null;
  sublabel?: string;
}) {
  const hasComparison =
    change !==
    undefined;

  const comparisonMissing =
    change ===
    null;

  const down =
    typeof change ===
      "number" &&
    change <
      0;

  return (
    <article className="rounded-[19px] border border-black/[0.055] bg-white p-5 shadow-[0_7px_24px_rgba(34,47,26,0.025)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[7px] font-bold uppercase tracking-[0.13em] text-black/28">
            {
              label
            }
          </span>

          <strong className="mt-2 block text-[26px] font-black tracking-[-0.05em] text-[#1e241b]">
            {
              value
            }
          </strong>
        </div>

        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f6ed] text-[#5d893f]">
          <span className="h-[18px] w-[18px]">
            {
              icon
            }
          </span>
        </span>
      </div>

      {hasComparison && (
        <div className="mt-4 flex items-center gap-2">
          {!comparisonMissing && (
            <span
              className={`flex items-center gap-1 text-[7.5px] font-bold ${
                down
                  ? "text-red-500"
                  : "text-[#5f913d]"
              }`}
            >
              <span className="h-3 w-3">
                <TrendingIcon
                  down={
                    down
                  }
                />
              </span>

              {formatPercent(
                change,
              )}
            </span>
          )}

          {comparisonMissing && (
            <span className="text-[7.5px] font-bold text-black/28">
              —
            </span>
          )}

          {sublabel && (
            <span className="text-[7px] text-black/25">
              {
                sublabel
              }
            </span>
          )}
        </div>
      )}
    </article>
  );
}

/* =========================================================
   LEGEND
   ========================================================= */

function LegendDot({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-2 w-2 rounded-full"
        style={{
          background:
            color,
        }}
      />

      <span className="text-[7px] font-semibold text-black/32">
        {
          label
        }
      </span>
    </div>
  );
}

/* =========================================================
   CONNECTION
   ========================================================= */

function ConnectionRow({
  label,
  value,
  configured,
  yes,
  no,
}: {
  label: string;
  value?: string | null;
  configured: boolean;
  yes: string;
  no: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-[#f7f8f4] px-3.5 py-3">
      <div className="min-w-0">
        <span className="block text-[7px] font-semibold text-black/30">
          {
            label
          }
        </span>

        {value && (
          <span className="mt-0.5 block max-w-[170px] truncate font-mono text-[6.5px] text-black/25">
            {
              value
            }
          </span>
        )}
      </div>

      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[6.5px] font-bold ${
          configured
            ? "bg-[#eaf5e4] text-[#507d33]"
            : "bg-black/[0.04] text-black/30"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            configured
              ? "bg-[#80c93c]"
              : "bg-black/15"
          }`}
        />

        {configured
          ? yes
          : no}
      </span>
    </div>
  );
}

/* =========================================================
   STATUS
   ========================================================= */

function StatusRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-[#f7f8f4] px-3.5 py-3">
      <span className="text-[7px] font-semibold text-black/30">
        {
          label
        }
      </span>

      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-2 py-1 text-[6.5px] font-bold text-black/30">
        <span className="h-1.5 w-1.5 rounded-full bg-black/15" />

        {
          value
        }
      </span>
    </div>
  );
}

/* =========================================================
   RANKED ANALYTICS CARD

   Countries + referrers use PAGE VIEWS.
   ========================================================= */

function RankedCard({
  title,
  items,
  emptyText,
}: {
  title:
    string;

  items: {
    name:
      string;

    visitors:
      number;

    pageViews:
      number;
  }[];

  emptyText:
    string;
}) {
  const realItems =
    items.filter(
      (
        item,
      ) =>
        item.pageViews >
        0,
    );

  const displayItems =
    realItems.length >
    0
      ? realItems
      : [
          {
            name:
              emptyText,

            visitors:
              0,

            pageViews:
              0,
          },
          {
            name:
              "—",

            visitors:
              0,

            pageViews:
              0,
          },
          {
            name:
              "—",

            visitors:
              0,

            pageViews:
              0,
          },
        ];

  const max =
    Math.max(
      ...displayItems.map(
        (
          item,
        ) =>
          item.pageViews,
      ),
      1,
    );

  return (
    <article className="rounded-[23px] border border-black/[0.055] bg-white p-5 shadow-[0_8px_30px_rgba(32,45,25,0.025)] sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-[12px] font-extrabold text-[#20251d]">
          {
            title
          }
        </h3>

        <span className="text-[6.5px] font-bold uppercase tracking-[0.1em] text-black/20">
          Page Views
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {displayItems.map(
          (
            item,
            index,
          ) => (
            <div
              key={`${item.name}-${index}`}
            >
              <div className="mb-1.5 flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#f1f6ed] text-[6.5px] font-black text-[#5d893f]">
                    {index +
                      1}
                  </span>

                  <span className="truncate text-[8px] font-semibold text-black/48">
                    {
                      item.name
                    }
                  </span>
                </div>

                <strong className="text-[8px] font-bold text-[#252b21]">
                  {formatCompact(
                    item.pageViews,
                  )}
                </strong>
              </div>

              <div className="ml-[30px] h-1.5 overflow-hidden rounded-full bg-black/[0.045]">
                <div
                  className="h-full rounded-full bg-[#6f9d4f] transition-[width]"
                  style={{
                    width:
                      item.pageViews >
                      0
                        ? `${Math.max(
                            3,
                            (item.pageViews /
                              max) *
                              100,
                          )}%`
                        : "0%",
                  }}
                />
              </div>
            </div>
          ),
        )}
      </div>
    </article>
  );
}

/* =========================================================
   INFO CARD
   ========================================================= */

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-[16px] border border-black/[0.05] bg-[#f8f9f5] p-4">
      <span className="text-[7px] font-bold uppercase tracking-[0.12em] text-black/25">
        {
          label
        }
      </span>

      <p className="mt-2 truncate text-[8px] font-medium text-black/50">
        {
          value
        }
      </p>
    </div>
  );
}