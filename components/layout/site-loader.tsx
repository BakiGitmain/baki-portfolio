"use client";

import {
  useEffect,
  useState,
} from "react";

import { useLanguage } from "@/components/providers/language-provider";
import { useLoading } from "@/components/providers/loading-provider";

const EXIT_DURATION_MS = 300;

const loaderCopy = {
  en: {
    preparing:
      "Preparing your experience...",
    ready:
      "Ready",
    system:
      "DIGITAL EXPERIENCE",
    network:
      "BAKI DIGITAL",
    language:
      "Choose loader language",
  },
  am: {
    preparing:
      "ገጹን በማዘጋጀት ላይ...",
    ready:
      "ዝግጁ ነው",
    system:
      "ዲጂታል ተሞክሮ",
    network:
      "ባኪ ዲጂታል",
    language:
      "የመጫኛ ቋንቋ ይምረጡ",
  },
} as const;

function NetworkDecoration({
  className,
}: {
  className: string;
}) {
  const points = [
    [12, 246],
    [76, 174],
    [67, 78],
    [141, 224],
    [156, 42],
    [201, 139],
    [266, 63],
    [278, 170],
    [342, 74],
  ];

  return (
    <svg
      viewBox="0 0 360 300"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 246L76 174L141 224L201 139L278 170L342 74"
        stroke="currentColor"
        strokeOpacity="0.24"
      />

      <path
        d="M76 174L67 78L156 42L201 139L266 63L342 74"
        stroke="currentColor"
        strokeOpacity="0.13"
      />

      {points.map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r="5"
          fill="currentColor"
          fillOpacity="0.28"
        />
      ))}
    </svg>
  );
}

function OrbitLoader() {
  return (
    <div
      className="loader-orbit"
      aria-hidden="true"
    >
      <span className="loader-orbit__halo" />
      <span className="loader-orbit__dotted-ring" />

      <span className="loader-orbit__ring loader-orbit__ring--outer">
        <span className="loader-orbit__node loader-orbit__node--one" />
      </span>

      <span className="loader-orbit__ring loader-orbit__ring--middle">
        <span className="loader-orbit__node loader-orbit__node--two" />
      </span>

      <span className="loader-orbit__ring loader-orbit__ring--inner">
        <span className="loader-orbit__node loader-orbit__node--three" />
      </span>

      <span className="loader-orbit__scan-line" />

      <div className="loader-orbit__core">
        <span className="loader-orbit__core-glow" />
        <span className="loader-orbit__code">
          &lt;/&gt;
        </span>
      </div>
    </div>
  );
}

export default function SiteLoader() {
  const {
    initialReady,
    revealExperience,
  } = useLoading();

  const {
    language,
    setLanguage,
  } = useLanguage();

  const [isExiting, setIsExiting] =
    useState(false);

  const [isVisible, setIsVisible] =
    useState(true);

  useEffect(() => {
    if (
      !initialReady ||
      isExiting
    ) {
      return;
    }

    const frame =
      window.requestAnimationFrame(
        () => {
          revealExperience();
          setIsExiting(true);
        },
      );

    return () => {
      window.cancelAnimationFrame(
        frame,
      );
    };
  }, [
    initialReady,
    isExiting,
    revealExperience,
  ]);

  useEffect(() => {
    if (!isExiting) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setIsVisible(false);
        },
        EXIT_DURATION_MS,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [isExiting]);

  if (!isVisible) {
    return null;
  }

  const copy =
    loaderCopy[language];

  const statusText =
    initialReady
      ? copy.ready
      : copy.preparing;

  return (
    <div
      className={`site-loader ${
        isExiting
          ? "site-loader--exiting"
          : ""
      }`}
      role="status"
      aria-live="polite"
      aria-label={statusText}
    >
      <div
        className="site-loader__background-grid"
        aria-hidden="true"
      />

      <NetworkDecoration className="site-loader__network site-loader__network--top-right" />
      <NetworkDecoration className="site-loader__network site-loader__network--bottom-left" />

      <div
        className="site-loader__dot-grid site-loader__dot-grid--top-left"
        aria-hidden="true"
      />

      <div
        className="site-loader__dot-grid site-loader__dot-grid--bottom-right"
        aria-hidden="true"
      />

      <div
        className="site-loader__technical-label site-loader__technical-label--left"
        aria-hidden="true"
      >
        <span className="site-loader__technical-dot" />
        {copy.system}
      </div>

      <div
        className="site-loader__technical-label site-loader__technical-label--right"
        aria-hidden="true"
      >
        {copy.network}
        <span className="site-loader__technical-dot" />
      </div>

      <main className="site-loader__content">
        <OrbitLoader />

        <div className="site-loader__brand">
          <span>BAKI</span>
          <span className="site-loader__brand-code">
            &lt;/&gt;
          </span>
        </div>

        <div className="site-loader__status-wrapper">
          <span
            className="site-loader__status-line"
            aria-hidden="true"
          />

          <p className="site-loader__status">
            {statusText}
          </p>

          <span
            className="site-loader__status-line"
            aria-hidden="true"
          />
        </div>
      </main>

      <div
        className="site-loader__languages"
        role="group"
        aria-label={copy.language}
      >
        <button
          type="button"
          aria-pressed={language === "en"}
          onClick={() => setLanguage("en")}
          className={
            language === "en"
              ? "site-loader__language site-loader__language--active"
              : "site-loader__language"
          }
        >
          EN
        </button>

        <span aria-hidden="true">/</span>

        <button
          type="button"
          aria-pressed={language === "am"}
          onClick={() => setLanguage("am")}
          className={
            language === "am"
              ? "site-loader__language site-loader__language--active"
              : "site-loader__language"
          }
        >
          AM
        </button>
      </div>
    </div>
  );
}
