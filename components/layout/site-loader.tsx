"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { useLanguage } from "@/components/providers/language-provider";
import {
  useLoading,
  type LoadingTaskId,
} from "@/components/providers/loading-provider";

const MINIMUM_VISIBLE_TIME = 1100;
const EXIT_DURATION = 950;

const loaderCopy = {
  en: {
    interface: "Preparing the interface...",
    fonts: "Loading typography...",
    images: "Loading visual assets...",
    scene3d: "Loading 3D objects...",
    page: "Connecting components...",
    ready: "Experience ready",
    degraded: "Opening optimized experience...",
    system: "AI EXPERIENCE SYSTEM",
    network: "PORTFOLIO NETWORK",
    progress: "Loading progress",
    language: "Choose loader language",
  },

  am: {
    interface: "የገጽ ቅርጹን በማዘጋጀት ላይ...",
    fonts: "ፊደሎችን በመጫን ላይ...",
    images: "ምስሎችን በመጫን ላይ...",
    scene3d: "3D እቃዎችን በመጫን ላይ...",
    page: "ኮምፖነንቶችን በማገናኘት ላይ...",
    ready: "ዝግጁ ነው",
    degraded: "የተመቻቸውን ገጽ በመክፈት ላይ...",
    system: "AI የተሞክሮ ስርዓት",
    network: "የፖርትፎሊዮ ኔትወርክ",
    progress: "የመጫን ሂደት",
    language: "የመጫኛ ቋንቋ ይምረጡ",
  },
} as const;

function useDisplayedProgress(target: number) {
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const valueRef = useRef(0);

  useEffect(() => {
    let animationFrame = 0;

    function updateProgress() {
      const current = valueRef.current;
      const distance = target - current;

      if (distance <= 0.08) {
        valueRef.current = target;
        setDisplayedProgress(target);
        return;
      }

      const movement = Math.max(0.15, distance * 0.085);
      const nextValue = Math.min(target, current + movement);

      valueRef.current = nextValue;
      setDisplayedProgress(nextValue);

      animationFrame =
        window.requestAnimationFrame(updateProgress);
    }

    animationFrame =
      window.requestAnimationFrame(updateProgress);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [target]);

  return Math.round(displayedProgress);
}

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

      <path
        d="M141 224L156 42M201 139L278 170"
        stroke="currentColor"
        strokeOpacity="0.1"
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
    actualProgress,
    currentTask,
    allTasksResolved,
    failedTasks,
    revealExperience,
  } = useLoading();

  const { language, setLanguage } = useLanguage();

  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (startedAtRef.current === null) {
      startedAtRef.current = performance.now();
    }
  }, []);

  const targetProgress = allTasksResolved
    ? 100
    : actualProgress;

  const displayedProgress =
    useDisplayedProgress(targetProgress);

  /*
   * Start the loader exit after every real task has resolved,
   * the displayed percentage has reached 100%, and the minimum
   * loader display time has elapsed.
   */
  useEffect(() => {
    if (
      !allTasksResolved ||
      displayedProgress < 100 ||
      isExiting
    ) {
      return;
    }

    const startedAt =
      startedAtRef.current ?? performance.now();

    const elapsedTime =
      performance.now() - startedAt;

    const remainingMinimumTime = Math.max(
      0,
      MINIMUM_VISIBLE_TIME - elapsedTime,
    );

    const exitTimer = window.setTimeout(() => {
      /*
       * Reveal the real page before the loader starts fading.
       * The loader remains above the page during its exit animation.
       */
      revealExperience();
      setIsExiting(true);
    }, remainingMinimumTime);

    return () => {
      window.clearTimeout(exitTimer);
    };
  }, [
    allTasksResolved,
    displayedProgress,
    isExiting,
    revealExperience,
  ]);

  /*
   * Remove the loader after its exit animation finishes.
   */
  useEffect(() => {
    if (!isExiting) {
      return;
    }

    const hideTimer = window.setTimeout(() => {
      setIsVisible(false);
    }, EXIT_DURATION);

    return () => {
      window.clearTimeout(hideTimer);
    };
  }, [isExiting]);

  if (!isVisible) {
    return null;
  }

  const copy = loaderCopy[language];

  let statusText: string;

  if (allTasksResolved) {
    statusText =
      failedTasks.length > 0
        ? copy.degraded
        : copy.ready;
  } else {
    const activeTask: LoadingTaskId =
      currentTask ?? "interface";

    statusText = copy[activeTask];
  }

  const loaderStyle = {
    "--loader-progress": `${displayedProgress}%`,
  } as CSSProperties;

  return (
    <div
      className={`site-loader ${
        isExiting ? "site-loader--exiting" : ""
      }`}
      style={loaderStyle}
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

          <p
            key={statusText}
            className="site-loader__status"
          >
            {statusText}
          </p>

          <span
            className="site-loader__status-line"
            aria-hidden="true"
          />
        </div>

        <div
          className="site-loader__progress-wrapper"
          role="progressbar"
          aria-label={copy.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={displayedProgress}
        >
          <div className="site-loader__progress-track">
            <span className="site-loader__progress-fill">
              <span className="site-loader__progress-light" />
            </span>
          </div>

          <span className="site-loader__percentage">
            {displayedProgress}%
          </span>
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