import {
  randomUUID,
} from "node:crypto";

import {
  lookup,
} from "node:dns/promises";

import {
  isIP,
} from "node:net";

import {
  performance,
} from "node:perf_hooks";

import {
  db,
} from "../config/db.js";

/* =========================================================
   CONFIG
   ========================================================= */

const HEALTH_CHECK_TIMEOUT_MS =
  10_000;

const MAX_REDIRECTS =
  5;

/* =========================================================
   TYPES
   ========================================================= */

export type HealthTarget =
  | "frontend"
  | "backend";

type MonitoredSiteRow = {
  id:
    string;

  name:
    string;

  slug:
    string;

  frontend_url:
    string;

  backend_url:
    string | null;

  health_url:
    string | null;
};

type HealthProbeResult = {
  online:
    boolean;

  statusCode:
    number | null;

  responseMs:
    number;

  errorMessage:
    string | null;
};

type StoredHealthResult = {
  target:
    HealthTarget;

  online:
    boolean;

  statusCode:
    number | null;

  responseMs:
    number;

  errorMessage:
    string | null;
};

/* =========================================================
   IP SECURITY
   ========================================================= */

function stripIpv6Brackets(
  value:
    string,
) {
  if (
    value.startsWith(
      "[",
    ) &&
    value.endsWith(
      "]",
    )
  ) {
    return value.slice(
      1,
      -1,
    );
  }

  return value;
}

function isPrivateIpv4(
  address:
    string,
) {
  const parts =
    address
      .split(
        ".",
      )
      .map(
        (
          part,
        ) =>
          Number(
            part,
          ),
      );

  if (
    parts.length !==
      4 ||
    parts.some(
      (
        part,
      ) =>
        !Number.isInteger(
          part,
        ) ||
        part <
          0 ||
        part >
          255,
    )
  ) {
    return true;
  }

  const [
    a,
    b,
    c,
  ] =
    parts;

  /*
    Unspecified / current network
  */

  if (
    a ===
    0
  ) {
    return true;
  }

  /*
    RFC1918
  */

  if (
    a ===
    10
  ) {
    return true;
  }

  if (
    a ===
      172 &&
    b >=
      16 &&
    b <=
      31
  ) {
    return true;
  }

  if (
    a ===
      192 &&
    b ===
      168
  ) {
    return true;
  }

  /*
    Loopback
  */

  if (
    a ===
    127
  ) {
    return true;
  }

  /*
    Link local
  */

  if (
    a ===
      169 &&
    b ===
      254
  ) {
    return true;
  }

  /*
    Carrier-grade NAT
  */

  if (
    a ===
      100 &&
    b >=
      64 &&
    b <=
      127
  ) {
    return true;
  }

  /*
    Benchmark networks
  */

  if (
    a ===
      198 &&
    (
      b ===
        18 ||
      b ===
        19
    )
  ) {
    return true;
  }

  /*
    Documentation / special-use networks
  */

  if (
    a ===
      192 &&
    b ===
      0
  ) {
    return true;
  }

  if (
    a ===
      198 &&
    b ===
      51 &&
    c ===
      100
  ) {
    return true;
  }

  if (
    a ===
      203 &&
    b ===
      0 &&
    c ===
      113
  ) {
    return true;
  }

  /*
    Multicast / reserved
  */

  if (
    a >=
    224
  ) {
    return true;
  }

  return false;
}

function isPrivateIpv6(
  address:
    string,
) {
  const normalized =
    stripIpv6Brackets(
      address,
    )
      .toLowerCase();

  if (
    normalized ===
      "::" ||
    normalized ===
      "::1"
  ) {
    return true;
  }

  /*
    IPv4 mapped IPv6
  */

  if (
    normalized.startsWith(
      "::ffff:",
    )
  ) {
    const ipv4 =
      normalized.slice(
        "::ffff:".length,
      );

    if (
      isIP(
        ipv4,
      ) ===
      4
    ) {
      return isPrivateIpv4(
        ipv4,
      );
    }
  }

  /*
    Unique-local fc00::/7
  */

  if (
    normalized.startsWith(
      "fc",
    ) ||
    normalized.startsWith(
      "fd",
    )
  ) {
    return true;
  }

  /*
    Link-local fe80::/10
  */

  if (
    /^fe[89ab]/.test(
      normalized,
    )
  ) {
    return true;
  }

  /*
    IPv6 documentation network
  */

  if (
    normalized.startsWith(
      "2001:db8:",
    )
  ) {
    return true;
  }

  /*
    Multicast ff00::/8
  */

  if (
    normalized.startsWith(
      "ff",
    )
  ) {
    return true;
  }

  return false;
}

function isPrivateAddress(
  address:
    string,
) {
  const normalized =
    stripIpv6Brackets(
      address,
    );

  const family =
    isIP(
      normalized,
    );

  if (
    family ===
    4
  ) {
    return isPrivateIpv4(
      normalized,
    );
  }

  if (
    family ===
    6
  ) {
    return isPrivateIpv6(
      normalized,
    );
  }

  return true;
}

/* =========================================================
   URL SECURITY

   Monitoring makes server-side requests, so do not allow
   localhost/private-network targets.

   This protects the health runner from becoming an easy
   internal-network request proxy.
   ========================================================= */

async function validatePublicHttpUrl(
  input:
    string,
) {
  const url =
    new URL(
      input,
    );

  if (
    url.protocol !==
      "https:" &&
    url.protocol !==
      "http:"
  ) {
    throw new Error(
      "Health check URL must use HTTP or HTTPS.",
    );
  }

  if (
    url.username ||
    url.password
  ) {
    throw new Error(
      "Health check URLs cannot contain credentials.",
    );
  }

  const hostname =
    stripIpv6Brackets(
      url.hostname,
    )
      .replace(
        /\.$/,
        "",
      )
      .toLowerCase();

  if (
    !hostname
  ) {
    throw new Error(
      "Health check URL has no hostname.",
    );
  }

  if (
    hostname ===
      "localhost" ||
    hostname.endsWith(
      ".localhost",
    )
  ) {
    throw new Error(
      "Localhost cannot be monitored.",
    );
  }

  const directFamily =
    isIP(
      hostname,
    );

  if (
    directFamily >
    0
  ) {
    if (
      isPrivateAddress(
        hostname,
      )
    ) {
      throw new Error(
        "Private network addresses cannot be monitored.",
      );
    }

    return url;
  }

  const addresses =
    await lookup(
      hostname,
      {
        all:
          true,

        verbatim:
          true,
      },
    );

  if (
    addresses.length ===
    0
  ) {
    throw new Error(
      "Hostname did not resolve.",
    );
  }

  for (
    const result of addresses
  ) {
    if (
      isPrivateAddress(
        result.address,
      )
    ) {
      throw new Error(
        "Hostname resolves to a private or reserved network address.",
      );
    }
  }

  return url;
}

/* =========================================================
   ERROR MESSAGE
   ========================================================= */

function getErrorMessage(
  error:
    unknown,
) {
  if (
    error instanceof
    Error
  ) {
    if (
      error.name ===
      "AbortError"
    ) {
      return `Request timed out after ${HEALTH_CHECK_TIMEOUT_MS}ms.`;
    }

    return error.message.slice(
      0,
      1000,
    );
  }

  return "Unknown health check error.";
}

/* =========================================================
   CANCEL RESPONSE BODY
   ========================================================= */

async function cancelResponseBody(
  response:
    Response,
) {
  try {
    await response.body?.cancel();
  } catch {
    /*
      Ignore cleanup errors.
    */
  }
}

/* =========================================================
   PROBE URL

   Redirects are followed manually.

   Every redirect target is validated again before the
   server connects to it.
   ========================================================= */

async function probeUrl(
  inputUrl:
    string,
): Promise<HealthProbeResult> {
  const controller =
    new AbortController();

  const startedAt =
    performance.now();

  const timeout =
    setTimeout(
      () => {
        controller.abort();
      },
      HEALTH_CHECK_TIMEOUT_MS,
    );

  try {
    let currentUrl =
      inputUrl;

    for (
      let redirectCount =
        0;
      redirectCount <=
        MAX_REDIRECTS;
      redirectCount +=
        1
    ) {
      const safeUrl =
        await validatePublicHttpUrl(
          currentUrl,
        );

      const response =
        await fetch(
          safeUrl,
          {
            method:
              "GET",

            redirect:
              "manual",

            signal:
              controller.signal,

            headers: {
              Accept:
                "text/html,application/json;q=0.9,*/*;q=0.8",

              "User-Agent":
                "Baki-Site-Health-Monitor/1.0",
            },
          },
        );

      const isRedirect =
        response.status >=
          300 &&
        response.status <=
          399;

      const location =
        response.headers.get(
          "location",
        );

      if (
        isRedirect &&
        location
      ) {
        await cancelResponseBody(
          response,
        );

        if (
          redirectCount >=
          MAX_REDIRECTS
        ) {
          throw new Error(
            "Too many redirects.",
          );
        }

        currentUrl =
          new URL(
            location,
            safeUrl,
          ).toString();

        continue;
      }

      const responseMs =
        Math.max(
          0,
          Math.round(
            performance.now() -
              startedAt,
          ),
        );

      const statusCode =
        response.status;

      const online =
        response.ok;

      await cancelResponseBody(
        response,
      );

      return {
        online,

        statusCode,

        responseMs,

        errorMessage:
          online
            ? null
            : `HTTP ${statusCode}`,
      };
    }

    throw new Error(
      "Too many redirects.",
    );
  } catch (
    error
  ) {
    return {
      online:
        false,

      statusCode:
        null,

      responseMs:
        Math.max(
          0,
          Math.round(
            performance.now() -
              startedAt,
          ),
        ),

      errorMessage:
        getErrorMessage(
          error,
        ),
    };
  } finally {
    clearTimeout(
      timeout,
    );
  }
}

/* =========================================================
   STORE CHECK
   ========================================================= */

async function storeCheck({
  runId,
  siteId,
  target,
  checkedUrl,
  result,
  checkedAt,
}: {
  runId:
    string;

  siteId:
    string;

  target:
    HealthTarget;

  checkedUrl:
    string;

  result:
    HealthProbeResult;

  checkedAt:
    Date;
}) {
  await db.query(
    `
      INSERT INTO site_health_checks (
        run_id,
        site_id,
        target,
        checked_url,
        online,
        status_code,
        response_ms,
        error_message,
        checked_at
      )

      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9
      )

      ON CONFLICT (
        site_id,
        run_id,
        target
      )

      DO NOTHING
    `,
    [
      runId,
      siteId,
      target,
      checkedUrl,
      result.online,
      result.statusCode,
      result.responseMs,
      result.errorMessage,
      checkedAt,
    ],
  );
}

/* =========================================================
   CHECK ONE SITE
   ========================================================= */

async function checkSite(
  site:
    MonitoredSiteRow,

  checkedAt:
    Date,
) {
  const runId =
    randomUUID();

  const backendCheckUrl =
    site.health_url?.trim() ||
    site.backend_url?.trim() ||
    null;

  const targets: {
    target:
      HealthTarget;

    url:
      string;
  }[] = [
    {
      target:
        "frontend",

      url:
        site.frontend_url,
    },
  ];

  if (
    backendCheckUrl
  ) {
    targets.push({
      target:
        "backend",

      url:
        backendCheckUrl,
    });
  }

  const probes =
    await Promise.all(
      targets.map(
        async (
          target,
        ) => ({
          ...target,

          result:
            await probeUrl(
              target.url,
            ),
        }),
      ),
    );

  await Promise.all(
    probes.map(
      (
        probe,
      ) =>
        storeCheck({
          runId,

          siteId:
            site.id,

          target:
            probe.target,

          checkedUrl:
            probe.url,

          result:
            probe.result,

          checkedAt,
        }),
    ),
  );

  const results:
    StoredHealthResult[] =
      probes.map(
        (
          probe,
        ) => ({
          target:
            probe.target,

          online:
            probe.result.online,

          statusCode:
            probe.result.statusCode,

          responseMs:
            probe.result.responseMs,

          errorMessage:
            probe.result.errorMessage,
        }),
      );

  return {
    siteId:
      site.id,

    name:
      site.name,

    slug:
      site.slug,

    runId,

    results,
  };
}

/* =========================================================
   RUN ALL MONITORED SITES
   ========================================================= */

export async function runAllMonitoredSiteHealthChecks() {
  const sitesResult =
    await db.query<MonitoredSiteRow>(
      `
        SELECT
          id,
          name,
          slug,
          frontend_url,
          backend_url,
          health_url

        FROM monitored_sites

        WHERE monitoring_enabled = TRUE

        ORDER BY created_at ASC
      `,
    );

  const checkedAt =
    new Date();

  const settled =
    await Promise.allSettled(
      sitesResult.rows.map(
        (
          site,
        ) =>
          checkSite(
            site,
            checkedAt,
          ),
      ),
    );

  const siteResults =
    settled
      .filter(
        (
          result,
        ): result is PromiseFulfilledResult<
          Awaited<
            ReturnType<
              typeof checkSite
            >
          >
        > =>
          result.status ===
          "fulfilled",
      )
      .map(
        (
          result,
        ) =>
          result.value,
      );

  const failedSites =
    settled.filter(
      (
        result,
      ) =>
        result.status ===
        "rejected",
    );

  for (
    const failure of failedSites
  ) {
    console.error(
      "Site health execution failed:",
      failure.reason,
    );
  }

  const checks =
    siteResults.flatMap(
      (
        site,
      ) =>
        site.results,
    );

  return {
    checkedAt:
      checkedAt.toISOString(),

    sitesConfigured:
      sitesResult.rows.length,

    sitesChecked:
      siteResults.length,

    sitesFailed:
      failedSites.length,

    checksStored:
      checks.length,

    onlineChecks:
      checks.filter(
        (
          check,
        ) =>
          check.online,
      ).length,

    offlineChecks:
      checks.filter(
        (
          check,
        ) =>
          !check.online,
      ).length,

    sites:
      siteResults,
  };
}