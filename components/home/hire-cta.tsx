"use client";

import { useRouter } from "next/navigation";

import { useExperienceMode } from "@/components/providers/experience-mode-provider";
import { useLanguage } from "@/components/providers/language-provider";

/* =========================================================
   ICONS
   ========================================================= */

function RocketIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14.4 5.2C16.6 3 19.6 3 21 3C21 4.4 21 7.4 18.8 9.6L14 14.4L9.6 10L14.4 5.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M9.8 10.2L6.5 10.5L3 14L8 15L9.8 10.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M13.8 14.2L13.5 17.5L10 21L9 16L13.8 14.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <circle
        cx="16.2"
        cy="7.8"
        r="1.6"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M12 10.5V16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="7.5"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}

function MoneyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M15 9.1C14.2 8.4 13.2 8 12 8C10.5 8 9.5 8.7 9.5 9.8C9.5 12.5 15 10.7 15 14C15 15.2 13.9 16 12.2 16C10.8 16 9.6 15.5 8.8 14.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      <path
        d="M12 6.5V8M12 16V17.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NoCodeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 7L3.5 12L8 17"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M16 7L20.5 12L16 17"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M5 4L19 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FlexibleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M12 7.5V12L15.5 14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HandshakeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8.5 9.5L11 7C12 6 13.5 6 14.5 7L17 9.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M3 10L7 6L10 9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M21 10L17 6L14 9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M7.5 14L11 17.5C11.8 18.3 13 18.3 13.8 17.5L17.5 14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M10 12L13.5 15.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function HireCTA() {
  const router =
    useRouter();

  const { language } =
    useLanguage();

  const { mode } =
    useExperienceMode();

  const performanceMode =
    mode === "performance";

  const copy =
    language === "am"
      ? {
          available:
            "የሽያጭ ወኪሎችን እየተቀበልን ነው",

          titleStart:
            "ደንበኛ ያግኙ።",

          titleAccent:
            "ኮሚሽን",

          titleEnd:
            "ያግኙ።",

          description:
            "ድረ ገጽ የሚፈልጉ ደንበኞችን ያግኙ፣ ምርቱን በሙያዊ መንገድ ያስተዋውቁ እና በእርስዎ በኩል የመጣ ሽያጭ ሲጠናቀቅ እስከ 25% ኮሚሽን ያግኙ።",

          apply:
            "አሁን ያመልክቱ",

          moreInfo:
            "ተጨማሪ መረጃ",

          commission:
            "እስከ 25% ኮሚሽን",

          noCoding:
            "Coding አያስፈልግም",

          flexible:
            "በተለዋዋጭ ጊዜ ይስሩ",

          professional:
            "ሙያዊ የሽያጭ ስራ",
        }
      : {
          available:
            "SALES REPRESENTATIVES WANTED",

          titleStart:
            "Find Clients.",

          titleAccent:
            "Earn",

          titleEnd:
            "Commission.",

          description:
            "Connect businesses and individuals with websites they actually need. Present the product professionally, bring qualified buyers, and earn up to 25% commission when your sale is successfully completed.",

          apply:
            "Apply Now",

          moreInfo:
            "More Info",

          commission:
            "Earn Up to 25%",

          noCoding:
            "No Coding Required",

          flexible:
            "Work Flexibly",

          professional:
            "Professional Sales",
        };

  /* =======================================================
     NAVIGATION
     ======================================================= */

  function openApplication() {
    router.push("/hire");
  }

  function openMoreInfo() {
    router.push(
      "/hire-info",
    );
  }

  return (
<section
  id="hire"
  className="hire-cta-section"
  data-hire-mode={
    performanceMode
      ? "performance"
      : "quality"
  }
>
      <div className="hire-cta-shell">
        {/* =============================================
            BACKGROUND EFFECTS
           ============================================= */}

        {!performanceMode && (
          <>
            <div className="hire-cta-glow hire-cta-glow--one" />

            <div className="hire-cta-glow hire-cta-glow--two" />
          </>
        )}

        <div className="hire-cta-grid-pattern" />

        {/* =============================================
            COPY
           ============================================= */}

        <div className="hire-cta-copy">
          <div className="hire-cta-availability">
            <span />

            {copy.available}
          </div>

          <h2>
            {copy.titleStart}{" "}

            <span>
              {copy.titleAccent}
            </span>{" "}

            {copy.titleEnd}
          </h2>

          <p>
            {copy.description}
          </p>

          {/* ===========================================
              ACTIONS
             =========================================== */}

          <div className="hire-cta-actions">
            {/* APPLY */}

            <button
              type="button"
              onClick={
                openApplication
              }
              className="hire-cta-primary"
            >
              <span className="hire-cta-button-icon">
                <RocketIcon />
              </span>

              <span>
                {copy.apply}
              </span>

              <span className="hire-cta-arrow">
                →
              </span>
            </button>

            {/* MORE INFO */}

            <button
              type="button"
              onClick={
                openMoreInfo
              }
              className="hire-cta-secondary"
            >
              <span className="hire-cta-button-icon">
                <InfoIcon />
              </span>

              <span>
                {copy.moreInfo}
              </span>

              <span className="hire-cta-arrow">
                →
              </span>
            </button>
          </div>
        </div>

        {/* =============================================
            VISUAL
           ============================================= */}

        <div className="hire-cta-visual">
          {/* ORBITS */}

          <div className="hire-orbit hire-orbit--outer" />

          <div className="hire-orbit hire-orbit--middle" />

          <div className="hire-orbit hire-orbit--inner" />

          {/* MOVING PARTICLES */}

          {!performanceMode && (
            <div className="hire-orbit-particles">
              <span className="hire-particle hire-particle--1" />

              <span className="hire-particle hire-particle--2" />

              <span className="hire-particle hire-particle--3" />

              <span className="hire-particle hire-particle--4" />
            </div>
          )}

          {/* CENTER */}

          <div className="hire-core">
            <div className="hire-core-inner">
              &lt;/&gt;
            </div>
          </div>

          {/* ===========================================
              FLOATING CARDS
             =========================================== */}

          <div className="hire-floating-card hire-floating-card--architecture">
            <span>
              <MoneyIcon />
            </span>

            <strong>
              {
                copy.commission
              }
            </strong>
          </div>

          <div className="hire-floating-card hire-floating-card--ai">
            <span>
              <NoCodeIcon />
            </span>

            <strong>
              {
                copy.noCoding
              }
            </strong>
          </div>

          <div className="hire-floating-card hire-floating-card--ui">
            <span>
              <FlexibleIcon />
            </span>

            <strong>
              {
                copy.flexible
              }
            </strong>
          </div>

          <div className="hire-floating-card hire-floating-card--backend">
            <span>
              <HandshakeIcon />
            </span>

            <strong>
              {
                copy.professional
              }
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}