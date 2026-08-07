"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useExperienceMode } from "@/components/providers/experience-mode-provider";
import { useLanguage } from "@/components/providers/language-provider";

type LocalizedText = {
  en: string;
  am: string;
};

type SkillIcon =
  | "frontend"
  | "backend"
  | "security"
  | "database"
  | "cloud"
  | "design"
  | "python"
  | "product";

type SkillGroup = {
  number: string;
  icon: SkillIcon;
  title: LocalizedText;
  description: LocalizedText;
  badge: LocalizedText;
  skills: string[];
};

const skillGroups: SkillGroup[] = [
  {
    number: "01",
    icon: "frontend",

    title: {
      en: "Frontend Engineering",
      am: "Frontend Engineering",
    },

    description: {
      en: "Building responsive, scalable and polished interfaces that feel fast across desktop and mobile.",
      am: "በdesktop እና mobile ላይ ፈጣን፣ responsive እና polished interfaces መገንባት።",
    },

    badge: {
      en: "CORE",
      am: "CORE",
    },

    skills: [
      "HTML",
      "CSS",
      "JavaScript",
      "TypeScript",
      "React",
      "Next.js",
      "Tailwind CSS",
      "Responsive UI",
    ],
  },

  {
    number: "02",
    icon: "backend",

    title: {
      en: "Backend & API Development",
      am: "Backend & API Development",
    },

    description: {
      en: "Designing server-side systems, APIs and application logic that power real full-stack products.",
      am: "Real full-stack products የሚያንቀሳቅሱ server-side systems፣ APIs እና application logic መገንባት።",
    },

    badge: {
      en: "SERVER",
      am: "SERVER",
    },

    skills: [
      "Node.js",
      "Express.js",
      "REST APIs",
      "Middleware",
      "Validation",
      "File Uploads",
      "API Architecture",
      "Error Handling",
    ],
  },

  {
    number: "03",
    icon: "security",

    title: {
      en: "Authentication & Security",
      am: "Authentication & Security",
    },

    description: {
      en: "Protecting accounts and application routes with backend-enforced authentication and authorization.",
      am: "Accounts እና application routesን backend-enforced authentication እና authorization በመጠቀም መጠበቅ።",
    },

    badge: {
      en: "SECURE",
      am: "SECURE",
    },

    skills: [
      "Secure Sessions",
      "HTTP Cookies",
      "bcrypt",
      "Role-Based Access",
      "Rate Limiting",
      "CORS",
      "Audit Logs",
      "Account Locking",
    ],
  },

  {
    number: "04",
    icon: "database",

    title: {
      en: "Databases & Data",
      am: "Databases & Data",
    },

    description: {
      en: "Designing structured data models and connecting applications to reliable cloud databases.",
      am: "Structured data models መንደፍ እና applicationsን reliable cloud databases ጋር ማገናኘት።",
    },

    badge: {
      en: "DATA",
      am: "DATA",
    },

    skills: [
      "PostgreSQL",
      "Neon",
      "SQL",
      "Prisma",
      "MongoDB",
      "Schema Design",
      "Relations",
      "Migrations",
    ],
  },

  {
    number: "05",
    icon: "cloud",

    title: {
      en: "Cloud & Deployment",
      am: "Cloud & Deployment",
    },

    description: {
      en: "Taking applications from local development to production-ready cloud deployments.",
      am: "Applicationsን ከlocal development ወደ production-ready cloud deployment ማድረስ።",
    },

    badge: {
      en: "DEPLOY",
      am: "DEPLOY",
    },

    skills: [
      "Vercel",
      "Render",
      "Cloudinary",
      "Environment Variables",
      "Production CORS",
      "Git",
      "GitHub",
      "Deployment Debugging",
    ],
  },

  {
    number: "06",
    icon: "design",

    title: {
      en: "UI/UX & Interactive Web",
      am: "UI/UX & Interactive Web",
    },

    description: {
      en: "Creating interfaces that combine strong visual design, motion, 3D experiences and performance.",
      am: "Strong visual design፣ motion፣ 3D experiences እና performance ያጣመሩ interfaces መፍጠር።",
    },

    badge: {
      en: "MOTION",
      am: "MOTION",
    },

    skills: [
      "UI/UX Design",
      "Spline 3D",
      "Lottie",
      "Lenis",
      "Scroll Animation",
      "Micro-interactions",
      "Glass UI",
      "Performance Fallbacks",
    ],
  },

  {
    number: "07",
    icon: "python",

    title: {
      en: "Python & Programming",
      am: "Python & Programming",
    },

    description: {
      en: "Programming foundations built through practical applications, problem solving and object-oriented projects.",
      am: "Practical applications፣ problem solving እና object-oriented projects በመጠቀም programming foundations መገንባት።",
    },

    badge: {
      en: "PYTHON",
      am: "PYTHON",
    },

    skills: [
      "Python",
      "OOP",
      "Tkinter",
      "Algorithms",
      "Problem Solving",
      "APIs",
      "Data Handling",
      "Automation Basics",
    ],
  },

  {
    number: "08",
    icon: "product",

    title: {
      en: "Product Engineering",
      am: "Product Engineering",
    },

    description: {
      en: "Connecting frontend, backend and user experience into complete products built around real workflows.",
      am: "Frontend፣ backend እና user experienceን በማገናኘት real workflows ዙሪያ complete products መገንባት።",
    },

    badge: {
      en: "PRODUCT",
      am: "PRODUCT",
    },

    skills: [
      "Admin Dashboards",
      "Customer Systems",
      "EN / AM i18n",
      "Accessibility",
      "Email Systems",
      "QR Experiences",
      "Membership Systems",
      "Performance UX",
    ],
  },
];

function SkillIconGraphic({
  type,
}: {
  type: SkillIcon;
}) {
  const iconClass =
    "h-[22px] w-[22px] sm:h-6 sm:w-6";

  if (type === "frontend") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={iconClass}
        aria-hidden="true"
      >
        <path
          d="M8.5 7L4 12L8.5 17"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M15.5 7L20 12L15.5 17"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M14 4L10 20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "backend") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={iconClass}
        aria-hidden="true"
      >
        <path
          d="M4 7.5L12 3L20 7.5L12 12L4 7.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        <path
          d="M4 12L12 16.5L20 12"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        <path
          d="M4 16.5L12 21L20 16.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "security") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={iconClass}
        aria-hidden="true"
      >
        <path
          d="M12 3L19 6V11C19 15.6 16.2 19.5 12 21C7.8 19.5 5 15.6 5 11V6L12 3Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        <path
          d="M9.5 12L11.2 13.7L14.8 10"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "database") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={iconClass}
        aria-hidden="true"
      >
        <ellipse
          cx="12"
          cy="6"
          rx="7"
          ry="3"
          stroke="currentColor"
          strokeWidth="1.8"
        />

        <path
          d="M5 6V12C5 13.7 8.1 15 12 15C15.9 15 19 13.7 19 12V6"
          stroke="currentColor"
          strokeWidth="1.8"
        />

        <path
          d="M5 12V18C5 19.7 8.1 21 12 21C15.9 21 19 19.7 19 18V12"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (type === "cloud") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={iconClass}
        aria-hidden="true"
      >
        <path
          d="M7.5 18H17C19.2 18 21 16.2 21 14C21 11.9 19.4 10.2 17.3 10C16.6 7 14.3 5 11.5 5C8.3 5 5.7 7.5 5.5 10.6C3.5 11 2 12.7 2 14.8C2 16.6 3.4 18 5.2 18H7.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M12 10V18"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        <path
          d="M9.5 12.5L12 10L14.5 12.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "design") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={iconClass}
        aria-hidden="true"
      >
        <path
          d="M5 17L7 19L18.5 7.5C19.3 6.7 19.3 5.4 18.5 4.6L18.4 4.5C17.6 3.7 16.3 3.7 15.5 4.5L4 16L5 17Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        <path
          d="M13.5 6.5L16.5 9.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />

        <path
          d="M4 20L7 19"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "python") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={iconClass}
        aria-hidden="true"
      >
        <path
          d="M12 3C7.6 3 7 5 7 7V9H12V10H5C3 10 2 11.5 2 14C2 17 3.5 18 5 18H7V15C7 13.1 8.3 12 10 12H14C15.7 12 17 10.9 17 9V6C17 4.1 15.4 3 12 3Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />

        <path
          d="M12 21C16.4 21 17 19 17 17V15H12V14H19C21 14 22 12.5 22 10C22 7 20.5 6 19 6H17V9C17 10.9 15.7 12 14 12H10C8.3 12 7 13.1 7 15V18C7 19.9 8.6 21 12 21Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />

        <circle
          cx="10"
          cy="6.5"
          r="0.8"
          fill="currentColor"
        />

        <circle
          cx="14"
          cy="17.5"
          r="0.8"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={iconClass}
      aria-hidden="true"
    >
      <path
        d="M5 5H10V10H5V5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M14 5H19V10H14V5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M5 14H10V19H5V14Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M14 14H19V19H14V14Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SkillCard({
  group,
  index,
  performanceMode,
}: {
  group: SkillGroup;
  index: number;
  performanceMode: boolean;
}) {
  const { language } =
    useLanguage();

  const cardRef =
    useRef<HTMLElement | null>(
      null,
    );

  const [
    visible,
    setVisible,
  ] = useState(false);

  useEffect(() => {
    const card =
      cardRef.current;

    if (!card) {
      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          const entry =
            entries[0];

          if (
            !entry?.isIntersecting
          ) {
            return;
          }

          setVisible(true);

          observer.disconnect();
        },
        {
          threshold:
            performanceMode
              ? 0.08
              : 0.2,

          rootMargin:
            "0px 0px -6% 0px",
        },
      );

    observer.observe(card);

    return () => {
      observer.disconnect();
    };
  }, [performanceMode]);

  const isRight =
    index % 2 !== 0;

  return (
    <article
      ref={cardRef}
      data-visible={
        visible
          ? "true"
          : "false"
      }
      className={`
        skill-flow-card

        ${
          performanceMode
            ? "skill-flow-card--performance"
            : "skill-flow-card--quality"
        }

        ${
          isRight
            ? "skill-flow-card--right ml-auto"
            : "skill-flow-card--left mr-auto"
        }

        relative
        z-20

        w-[92%]

        overflow-hidden

        rounded-[24px]

        border
        border-black/[0.07]

        bg-white/[0.94]

        p-5

        sm:w-[82%]
        sm:p-6

        md:w-[67%]

        lg:w-[46%]
        lg:p-7
      `}
    >
      <span
        aria-hidden="true"
        className={`
          pointer-events-none

          absolute
          left-8
          right-8
          top-0

          h-px

          bg-gradient-to-r
          from-transparent
          via-white
          to-transparent
        `}
      />

      <div className="flex items-start gap-4">
        <div
          className={`
            skill-flow-icon

            flex
            h-12
            w-12
            shrink-0

            items-center
            justify-center

            rounded-[15px]

            border
            border-[#9bd75b]/20

            bg-[linear-gradient(145deg,#f3ffdc,#ecf9dd)]

            text-[#72ae35]

            sm:h-14
            sm:w-14
            sm:rounded-[17px]
          `}
        >
          <SkillIconGraphic
            type={group.icon}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span
                className={`
                  text-[9px]
                  font-bold

                  uppercase
                  tracking-[0.18em]

                  text-[#76aa49]
                `}
              >
                {group.number}
              </span>

              <h3
                className={`
                  mt-1

                  text-[20px]
                  font-bold

                  tracking-[-0.04em]

                  text-[#171b14]

                  sm:text-[23px]
                `}
              >
                {
                  group.title[
                    language
                  ]
                }
              </h3>
            </div>

            <span
              className={`
                shrink-0

                rounded-full

                border
                border-[#8fca59]/20

                bg-[#f2fae9]

                px-2.5
                py-1

                text-[8px]
                font-bold

                tracking-[0.13em]

                text-[#659739]
              `}
            >
              {
                group.badge[
                  language
                ]
              }
            </span>
          </div>

          <p
            className={`
              mt-2

              max-w-[470px]

              text-[11px]
              leading-[1.7]

              text-black/43

              sm:text-[12px]
            `}
          >
            {
              group.description[
                language
              ]
            }
          </p>
        </div>
      </div>

      <div
        className={`
          mt-5

          flex
          flex-wrap
          gap-2

          border-t
          border-black/[0.05]

          pt-4
        `}
      >
        {group.skills.map(
          (skill) => (
            <span
              key={skill}
              className={`
                skill-flow-chip

                rounded-[9px]

                border
                border-black/[0.055]

                bg-[#f6f7f3]

                px-2.5
                py-1.5

                text-[9px]
                font-semibold

                text-black/52

                sm:text-[10px]
              `}
            >
              {skill}
            </span>
          ),
        )}
      </div>

      {!performanceMode && (
        <div
          aria-hidden="true"
          className={`
            pointer-events-none

            absolute
            -bottom-8
            -right-8

            h-24
            w-24

            rounded-full

            bg-[#b9ed78]/10

            blur-2xl
          `}
        />
      )}
    </article>
  );
}

function ScrollIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect
        x="7"
        y="3"
        width="10"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M12 7V11"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function SkillsSection() {
  const { language } =
    useLanguage();

  const {
    mode: experienceMode,
  } = useExperienceMode();

  const performanceMode =
    experienceMode ===
    "performance";

  const sectionRef =
    useRef<HTMLElement | null>(
      null,
    );

  const flowRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const liquidPathRef =
    useRef<SVGPathElement | null>(
      null,
    );

  const copy =
    language === "am"
      ? {
          eyebrow:
            "WHAT I DO BEST",

          titleStart:
            "ከidea ወደ",

          titleAccent:
            "production",

          titleEnd:
            "የሚፈሱ ችሎታዎች።",

          description:
            "Frontend፣ backend፣ databases፣ security፣ deployment፣ 3D እና programming — ሙሉ digital products ለመገንባት የምጠቀምባቸው ቴክኖሎጂዎች።",

          scroll:
            "Scroll ሲያደርጉ skills እንዴት እንደሚፈሱ ይመልከቱ",

          end:
            "Always learning. Always building.",
        }
      : {
          eyebrow:
            "WHAT I DO BEST",

          titleStart:
            "Skills that flow from",

          titleAccent:
            "idea",

          titleEnd:
            "to production.",

          description:
            "Frontend, backend, data, security, deployment, interactive 3D and programming — connected into one complete full-stack workflow.",

          scroll:
            "Scroll to watch the skills flow",

          end:
            "Always learning. Always building.",
        };

  /*
   * Scroll-linked liquid.
   *
   * Important:
   * we update the actual SVG path rather than React state.
   * That avoids a component render for every scroll frame.
   */
  useEffect(() => {
    const flow =
      flowRef.current;

    const liquidPath =
      liquidPathRef.current;

    if (
      !flow ||
      !liquidPath
    ) {
      return;
    }

    let animationFrame = 0;

    /*
     * In Performance mode we avoid processing extremely
     * tiny scroll differences.
     *
     * That cuts unnecessary style writes on phones.
     */
    let previousProgress = -1;

    function updateProgress() {
      const currentFlow =
        flowRef.current;

      const currentPath =
        liquidPathRef.current;

      if (
        !currentFlow ||
        !currentPath
      ) {
        return;
      }

      const rect =
        currentFlow.getBoundingClientRect();

      const flowTop =
        window.scrollY +
        rect.top;

      const flowHeight =
        currentFlow.offsetHeight;

      const viewportHeight =
        window.innerHeight;

      /*
       * This is the tuned later starting point
       * from our previous adjustment.
       */
      const start =
        flowTop -
        viewportHeight * 0.52;

      const end =
        flowTop +
        flowHeight -
        viewportHeight * 0.48;

      const denominator =
        Math.max(
          1,
          end - start,
        );

      const rawProgress =
        (
          window.scrollY -
          start
        ) /
        denominator;

      let progress =
        Math.min(
          1,
          Math.max(
            0,
            rawProgress,
          ),
        );

      /*
       * PERFORMANCE MODE
       *
       * Quantize the value slightly.
       *
       * Quality:
       * thousands of tiny possible progress changes.
       *
       * Performance:
       * 400 steps are more than enough visually but reduce
       * needless SVG paint updates during fast scrolling.
       */
      if (
        performanceMode
      ) {
        progress =
          Math.round(
            progress * 400,
          ) / 400;

        if (
          progress ===
          previousProgress
        ) {
          return;
        }
      }

      previousProgress =
        progress;

      currentPath.style.strokeDashoffset =
        String(
          1 - progress,
        );

      currentPath.style.opacity =
        progress > 0.001
          ? "1"
          : "0";
    }

    function requestUpdate() {
      /*
       * Never allow multiple queued animation frames.
       */
      if (animationFrame) {
        return;
      }

      animationFrame =
        window.requestAnimationFrame(
          () => {
            animationFrame = 0;

            updateProgress();
          },
        );
    }

    updateProgress();

    window.addEventListener(
      "scroll",
      requestUpdate,
      {
        passive: true,
      },
    );

    window.addEventListener(
      "resize",
      requestUpdate,
      {
        passive: true,
      },
    );

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(
          animationFrame,
        );
      }

      window.removeEventListener(
        "scroll",
        requestUpdate,
      );

      window.removeEventListener(
        "resize",
        requestUpdate,
      );
    };
  }, [performanceMode]);

  return (
    <section
      id="skills"
      ref={sectionRef}
      data-performance-mode={
        performanceMode
          ? "true"
          : "false"
      }
      className={`
        skills-flow-section

        ${
          performanceMode
            ? "skills-flow-section--performance"
            : "skills-flow-section--quality"
        }

        relative

        scroll-mt-24

        overflow-hidden

        bg-[#f8f8f4]

        px-4
        py-20

        sm:px-6
        sm:py-24

        lg:px-8
        lg:py-28
      `}
    >
      {/* ==========================================
          BACKGROUND DOTS
         ========================================== */}

      <div
        aria-hidden="true"
        className={`
          skills-flow-dot-background

          pointer-events-none

          absolute
          inset-0

          opacity-[0.45]

          [background-image:radial-gradient(rgba(68,104,43,0.11)_1px,transparent_1px)]
          [background-size:28px_28px]

          [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]
        `}
      />

      {/* ==========================================
          LARGE QUALITY-MODE GLOW

          Completely removed from the DOM in Performance.
         ========================================== */}

      {!performanceMode && (
        <div
          aria-hidden="true"
          className={`
            pointer-events-none

            absolute
            left-1/2
            top-[18%]

            h-[520px]
            w-[520px]

            -translate-x-1/2

            rounded-full

            bg-[#dff2cf]/35

            blur-[150px]
          `}
        />
      )}

      <div className="relative mx-auto max-w-[1450px]">
        {/* ==========================================
            HEADER
           ========================================== */}

        <header className="mx-auto max-w-[780px] text-center">
          <div
            className={`
              skills-flow-header-pill

              mx-auto

              inline-flex
              items-center
              gap-2

              rounded-full

              border
              border-black/[0.06]

              bg-white/80

              px-3
              py-1.5
            `}
          >
            <span
              className={`
                skills-flow-status-dot

                h-1.5
                w-1.5

                rounded-full

                bg-[#9ce23f]
              `}
            />

            <span
              className={`
                text-[9px]
                font-bold

                tracking-[0.17em]

                text-black/45
              `}
            >
              {copy.eyebrow}
            </span>
          </div>

          <h2
            className={`
              mt-6

              text-[38px]
              font-bold

              leading-[0.98]

              tracking-[-0.06em]

              text-[#171a15]

              sm:text-[52px]

              lg:text-[64px]
            `}
          >
            {copy.titleStart}{" "}

            <span className="text-[#4e7f31]">
              {
                copy.titleAccent
              }
            </span>{" "}

            {copy.titleEnd}
          </h2>

          <p
            className={`
              mx-auto
              mt-5

              max-w-[650px]

              text-[12px]
              leading-6

              text-black/42

              sm:text-[14px]
              sm:leading-7
            `}
          >
            {copy.description}
          </p>

          <div
            className={`
              mx-auto
              mt-7

              inline-flex

              items-center
              gap-2

              text-[10px]
              font-semibold

              text-[#66963e]
            `}
          >
            <span
              className={`
                flex
                h-7
                w-7

                items-center
                justify-center

                rounded-full

                border
                border-[#8ac452]/20

                bg-[#eff8e7]
              `}
            >
              <ScrollIcon />
            </span>

            <span>
              {copy.scroll}
            </span>
          </div>
        </header>

        {/* ==========================================
            FLOW
           ========================================== */}

        <div
          ref={flowRef}
          className={`
            relative

            mx-auto
            mt-20

            max-w-[1200px]

            sm:mt-24
            lg:mt-28
          `}
        >
          {/* ==========================================
              TUBE
             ========================================== */}

          <svg
            viewBox="0 0 1000 2800"
            preserveAspectRatio="none"
            className={`
              skills-flow-svg

              pointer-events-none

              absolute
              inset-0

              z-0

              h-full
              w-full

              overflow-visible
            `}
            aria-hidden="true"
          >
            <defs>
              {!performanceMode && (
                <>
                  <linearGradient
                    id="skillsLiquidGradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#d8ff55"
                    />

                    <stop
                      offset="45%"
                      stopColor="#a8eb39"
                    />

                    <stop
                      offset="100%"
                      stopColor="#7fc52d"
                    />
                  </linearGradient>

                  <filter
                    id="skillsLiquidGlow"
                    x="-100%"
                    y="-100%"
                    width="300%"
                    height="300%"
                    colorInterpolationFilters="sRGB"
                  >
                    <feGaussianBlur
                      stdDeviation="8"
                      result="blur"
                    />

                    <feMerge>
                      <feMergeNode
                        in="blur"
                      />

                      <feMergeNode
                        in="SourceGraphic"
                      />
                    </feMerge>
                  </filter>
                </>
              )}
            </defs>

            {/* OUTER TUBE */}

            <path
              pathLength="1"
              d="
                M500 0
                C500 110 500 150 500 210

                C500 310 255 300 255 420
                C255 540 745 530 745 650

                C745 770 255 760 255 880
                C255 1000 745 990 745 1110

                C745 1230 255 1220 255 1340
                C255 1460 745 1450 745 1570

                C745 1690 255 1680 255 1800
                C255 1920 745 1910 745 2030

                C745 2150 255 2140 255 2260
                C255 2380 745 2370 745 2490

                C745 2610 500 2580 500 2800
              "
              className="skills-flow-tube"
            />

            {/* GLASS HIGHLIGHT */}

            {!performanceMode && (
              <path
                pathLength="1"
                d="
                  M500 0
                  C500 110 500 150 500 210

                  C500 310 255 300 255 420
                  C255 540 745 530 745 650

                  C745 770 255 760 255 880
                  C255 1000 745 990 745 1110

                  C745 1230 255 1220 255 1340
                  C255 1460 745 1450 745 1570

                  C745 1690 255 1680 255 1800
                  C255 1920 745 1910 745 2030

                  C745 2150 255 2140 255 2260
                  C255 2380 745 2370 745 2490

                  C745 2610 500 2580 500 2800
                "
                className="skills-flow-tube-highlight"
              />
            )}

            {/* LIQUID */}

            <path
              ref={liquidPathRef}
              pathLength="1"
              d="
                M500 0
                C500 110 500 150 500 210

                C500 310 255 300 255 420
                C255 540 745 530 745 650

                C745 770 255 760 255 880
                C255 1000 745 990 745 1110

                C745 1230 255 1220 255 1340
                C255 1460 745 1450 745 1570

                C745 1690 255 1680 255 1800
                C255 1920 745 1910 745 2030

                C745 2150 255 2140 255 2260
                C255 2380 745 2370 745 2490

                C745 2610 500 2580 500 2800
              "
              stroke={
                performanceMode
                  ? "#9eea39"
                  : "url(#skillsLiquidGradient)"
              }
              filter={
                performanceMode
                  ? undefined
                  : "url(#skillsLiquidGlow)"
              }
              className="skills-flow-liquid"
            />
          </svg>

          {/* ==========================================
              CARDS
             ========================================== */}

          <div
            className={`
              relative
              z-10

              flex
              flex-col

              gap-20

              sm:gap-24
              md:gap-28

              lg:gap-32
            `}
          >
            {skillGroups.map(
              (
                group,
                index,
              ) => (
                <SkillCard
                  key={
                    group.number
                  }
                  group={group}
                  index={index}
                  performanceMode={
                    performanceMode
                  }
                />
              ),
            )}
          </div>

          {/* ==========================================
              END
             ========================================== */}

          <div
            className={`
              skills-flow-end-pill

              relative
              z-20

              mx-auto
              mt-20

              flex
              w-fit

              items-center
              gap-2

              rounded-full

              border
              border-[#87c24f]/20

              bg-white/90

              px-4
              py-2

              text-[9px]
              font-bold

              uppercase
              tracking-[0.15em]

              text-[#568335]

              sm:mt-24
            `}
          >
            <span
              className={`
                skills-flow-status-dot

                h-2
                w-2

                rounded-full

                bg-[#a8ec3e]
              `}
            />

            <span>
              {copy.end}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}