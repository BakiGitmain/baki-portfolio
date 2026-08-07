"use client";

import Image from "next/image";
import {
  useState,
  type CSSProperties,
} from "react";

import { useExperienceMode } from "@/components/providers/experience-mode-provider";
import { useLanguage } from "@/components/providers/language-provider";

type LocalizedText = {
  en: string;
  am: string;
};

type OrbitTech = {
  id: string;
  name: string;
  image: string;
  level: number;
  levelLabel: LocalizedText;
  description: LocalizedText;
  angle: number;
};

type SkillCategory = {
  title: LocalizedText;
  description: LocalizedText;
  progress: number;

  icon:
    | "frontend"
    | "backend"
    | "database"
    | "cloud"
    | "ai";

  tools: {
    name: string;
    image?: string;
  }[];
};

type WorkStep = {
  number: string;
  title: LocalizedText;
  description: LocalizedText;

  icon:
    | "research"
    | "design"
    | "develop"
    | "deploy";
};

/* =========================================================
   INTERACTION HELPERS
   ========================================================= */

/*
 * We only treat real mouse/fine-pointer devices as hover
 * devices.
 *
 * Phones often fire synthetic mouse/focus events during
 * a tap, which was causing the double-tap problem.
 */
function supportsHoverInteraction() {
  if (
    typeof window ===
    "undefined"
  ) {
    return false;
  }

  return window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  ).matches;
}

/* =========================================================
   ORBIT TECHNOLOGIES
   ========================================================= */

const orbitTech: OrbitTech[] = [
  {
    id: "react",

    name: "React",

    image:
      "/images/stack/react.png",

    level: 90,

    angle: 270,

    levelLabel: {
      en: "Strong",
      am: "ጠንካራ",
    },

    description: {
      en: "Building reusable component systems, interactive interfaces and complete frontend experiences.",

      am: "Reusable components፣ interactive interfaces እና complete frontend experiences ለመገንባት እጠቀማለሁ።",
    },
  },

  {
    id: "typescript",

    name: "TypeScript",

    image:
      "/images/stack/typescript.png",

    level: 86,

    angle: 330,

    levelLabel: {
      en: "Strong",
      am: "ጠንካራ",
    },

    description: {
      en: "Using strict types to build safer React, Next.js and backend applications.",

      am: "Safer React፣ Next.js እና backend applications ለመገንባት strict typing እጠቀማለሁ።",
    },
  },

  {
    id: "tailwind",

    name: "Tailwind CSS",

    image:
      "/images/stack/tailwind.png",

    level: 94,

    angle: 30,

    levelLabel: {
      en: "Advanced",
      am: "ከፍተኛ",
    },

    description: {
      en: "Creating responsive interfaces, design systems, animations and detailed visual layouts.",

      am: "Responsive interfaces፣ design systems፣ animations እና detailed layouts ለመፍጠር እጠቀማለሁ።",
    },
  },

  {
    id: "node",

    name: "Node.js",

    image:
      "/images/stack/nodejs.png",

    level: 88,

    angle: 90,

    levelLabel: {
      en: "Strong",
      am: "ጠንካራ",
    },

    description: {
      en: "Building server-side application logic, APIs, authentication and production backend systems.",

      am: "APIs፣ authentication እና production backend systems ለመገንባት Node.js እጠቀማለሁ።",
    },
  },

  {
    id: "postgresql",

    name: "PostgreSQL",

    image:
      "/images/stack/postgresql.png",

    level: 84,

    angle: 150,

    levelLabel: {
      en: "Comfortable",
      am: "ጥሩ",
    },

    description: {
      en: "Designing relational schemas, queries and production data models for full-stack applications.",

      am: "Relational schemas፣ queries እና production data models ለመገንባት እጠቀማለሁ።",
    },
  },

  {
    id: "nextjs",

    name: "Next.js",

    image:
      "/images/stack/nextjs.png",

    level: 90,

    angle: 210,

    levelLabel: {
      en: "Strong",
      am: "ጠንካራ",
    },

    description: {
      en: "Building complete production websites with App Router, server rendering, routing and optimized frontend architecture.",

      am: "App Router፣ routing፣ server rendering እና optimized architecture ያላቸው production websites ለመገንባት እጠቀማለሁ።",
    },
  },
];

/* =========================================================
   SKILL CATEGORIES
   ========================================================= */

const categories: SkillCategory[] = [
  {
    title: {
      en: "Frontend",
      am: "Frontend",
    },

    description: {
      en: "Modern interfaces & interaction",
      am: "Modern interfaces & interaction",
    },

    progress: 92,

    icon: "frontend",

    tools: [
      {
        name: "React",
        image:
          "/images/stack/react.png",
      },

      {
        name: "Next.js",
        image:
          "/images/stack/nextjs.png",
      },

      {
        name: "TypeScript",
        image:
          "/images/stack/typescript.png",
      },

      {
        name: "Tailwind",
        image:
          "/images/stack/tailwind.png",
      },
    ],
  },

  {
    title: {
      en: "Backend",
      am: "Backend",
    },

    description: {
      en: "APIs, auth & server systems",
      am: "APIs, auth & server systems",
    },

    progress: 88,

    icon: "backend",

    tools: [
      {
        name: "Node.js",
        image:
          "/images/stack/nodejs.png",
      },

      {
        name: "REST APIs",
      },

      {
        name: "Express",
      },

      {
        name: "Auth",
      },
    ],
  },

  {
    title: {
      en: "Database",
      am: "Database",
    },

    description: {
      en: "Structured production data",
      am: "Structured production data",
    },

    progress: 84,

    icon: "database",

    tools: [
      {
        name: "PostgreSQL",
        image:
          "/images/stack/postgresql.png",
      },

      {
        name: "Neon",
      },

      {
        name: "SQL",
      },
    ],
  },

  {
    title: {
      en: "Tools & Cloud",
      am: "Tools & Cloud",
    },

    description: {
      en: "From development to deployment",
      am: "From development to deployment",
    },

    progress: 85,

    icon: "cloud",

    tools: [
      {
        name: "Git",
        image:
          "/images/stack/git.png",
      },

      {
        name: "Vercel",
        image:
          "/images/stack/vercel.png",
      },

      {
        name: "Cloudinary",
        image:
          "/images/stack/cloudinary.png",
      },
    ],
  },

  {
    title: {
      en: "AI & Integrations",
      am: "AI & Integrations",
    },

    description: {
      en: "Adding intelligence to products",
      am: "Adding intelligence to products",
    },

    progress: 72,

    icon: "ai",

    tools: [
      {
        name: "OpenAI",
        image:
          "/images/stack/openai.png",
      },

      {
        name: "LangChain",
        image:
          "/images/stack/langchain.png",
      },

      {
        name: "APIs",
      },
    ],
  },
];

/* =========================================================
   HOW I WORK
   ========================================================= */

const workSteps: WorkStep[] = [
  {
    number: "01",

    icon: "research",

    title: {
      en: "Plan & Research",
      am: "እቅድ & ጥናት",
    },

    description: {
      en: "I understand the problem, research the requirements and define the right solution before building.",

      am: "ከመገንባቴ በፊት ችግሩን እረዳለሁ፣ requirements እመረምራለሁ እና ትክክለኛውን solution እወስናለሁ።",
    },
  },

  {
    number: "02",

    icon: "design",

    title: {
      en: "Design & Prototype",
      am: "Design & Prototype",
    },

    description: {
      en: "I shape the UI/UX, interaction flow and responsive experience before turning it into production code.",

      am: "Production code ከመጻፌ በፊት UI/UX፣ interaction flow እና responsive experience እቀርጻለሁ።",
    },
  },

  {
    number: "03",

    icon: "develop",

    title: {
      en: "Develop & Build",
      am: "Develop & Build",
    },

    description: {
      en: "I write clean, scalable code and connect frontend, backend, data and services into one system.",

      am: "Clean scalable code በመጻፍ frontend፣ backend፣ data እና servicesን በአንድ system አገናኛለሁ።",
    },
  },

  {
    number: "04",

    icon: "deploy",

    title: {
      en: "Test & Deploy",
      am: "Test & Deploy",
    },

    description: {
      en: "I test responsiveness and real workflows, optimize the experience and deploy confidently to production.",

      am: "Responsiveness እና real workflows እፈትሻለሁ፣ experienceን optimize አደርጋለሁ እና production ላይ deploy አደርጋለሁ።",
    },
  },
];

/* =========================================================
   CATEGORY ICON
   ========================================================= */

function CategoryIcon({
  type,
}: {
  type: SkillCategory["icon"];
}) {
  if (type === "frontend") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M8 7L3.5 12L8 17"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M16 7L20.5 12L16 17"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "backend") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="4"
          y="5"
          width="16"
          height="6"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.8"
        />

        <rect
          x="4"
          y="13"
          width="16"
          height="6"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.8"
        />

        <circle
          cx="8"
          cy="8"
          r="1"
          fill="currentColor"
        />

        <circle
          cx="8"
          cy="16"
          r="1"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (type === "database") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
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
        aria-hidden="true"
      >
        <path
          d="M6.5 18H17C19.2 18 21 16.3 21 14.2C21 12.2 19.4 10.5 17.4 10.3C16.7 7.5 14.4 5.5 11.6 5.5C8.5 5.5 5.9 7.9 5.6 11C3.5 11.3 2 12.9 2 15C2 16.7 3.4 18 5.2 18H6.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 3C7.9 3 7 3.9 7 5V6C5.3 6.4 4 7.9 4 9.7V10.5C2.8 11.1 2 12.4 2 14C2 16 3.5 17.6 5.4 17.9C5.7 19.7 7.2 21 9 21C10.2 21 11.3 20.4 12 19.5C12.7 20.4 13.8 21 15 21C16.8 21 18.3 19.7 18.6 17.9C20.5 17.6 22 16 22 14C22 12.4 21.2 11.1 20 10.5V9.7C20 7.9 18.7 6.4 17 6V5C17 3.9 16.1 3 15 3C13.8 3 12.7 3.7 12 4.7C11.3 3.7 10.2 3 9 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M12 5V19"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* =========================================================
   WORK ICON
   ========================================================= */

function WorkIcon({
  type,
}: {
  type: WorkStep["icon"];
}) {
  if (type === "research") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="10.5"
          cy="10.5"
          r="6"
          stroke="currentColor"
          strokeWidth="1.8"
        />

        <path
          d="M15 15L20 20"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        <path
          d="M8.5 10.5L10 12L13 9"
          stroke="currentColor"
          strokeWidth="1.6"
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
        aria-hidden="true"
      >
        <path
          d="M4 18.5L5.5 20L18.5 7C19.3 6.2 19.3 5 18.5 4.2C17.7 3.4 16.5 3.4 15.7 4.2L2.7 17.2L4 18.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        <path
          d="M13.7 6.2L16.6 9.1"
          stroke="currentColor"
          strokeWidth="1.7"
        />
      </svg>
    );
  }

  if (type === "develop") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M8 7L3.5 12L8 17"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M16 7L20.5 12L16 17"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M14 4L10 20"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14 4C17.5 4.4 20 7.4 20 11C20 15.4 16.4 19 12 19C8.4 19 5.4 16.5 5 13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M14 4L16 2M14 4L12 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M9 12L11 14L15 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =========================================================
   SUMMARY CARD
   ========================================================= */

function SummaryCard({
  category,
}: {
  category: SkillCategory;
}) {
  const { language } =
    useLanguage();

  return (
    <article className="skills-stack-summary-card">
      <div className="skills-stack-summary-top">
        <div className="skills-stack-summary-icon">
          <CategoryIcon
            type={category.icon}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="skills-stack-summary-title">
                {
                  category.title[
                    language
                  ]
                }
              </h3>

              <p className="skills-stack-summary-description">
                {
                  category.description[
                    language
                  ]
                }
              </p>
            </div>

            <span className="skills-stack-summary-number">
              {category.progress}%
            </span>
          </div>

          <div className="skills-stack-summary-progress">
            <span
              style={{
                width: `${category.progress}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="skills-stack-tool-list">
        {category.tools.map(
          (tool) => (
            <span
              key={tool.name}
              className="skills-stack-tool-chip"
            >
              {tool.image && (
                <Image
                  src={tool.image}
                  alt=""
                  width={14}
                  height={14}
                  className="h-3.5 w-3.5 object-contain"
                />
              )}

              {tool.name}
            </span>
          ),
        )}
      </div>
    </article>
  );
}

/* =========================================================
   ORBIT BUTTON
   ========================================================= */

function OrbitTechButton({
  tech,
  active,
  onDesktopEnter,
  onDesktopLeave,
  onActivate,
}: {
  tech: OrbitTech;
  active: boolean;

  onDesktopEnter: () => void;
  onDesktopLeave: () => void;
  onActivate: () => void;
}) {
  function handleMouseEnter() {
    /*
     * Desktop/laptop mouse only.
     *
     * Touch devices ignore this completely.
     */
    if (
      !supportsHoverInteraction()
    ) {
      return;
    }

    onDesktopEnter();
  }

  function handleMouseLeave() {
    if (
      !supportsHoverInteraction()
    ) {
      return;
    }

    onDesktopLeave();
  }

  function handleClick() {
    /*
     * Desktop already uses hover.
     *
     * Clicking with a real mouse should NOT toggle the
     * active state off while the pointer is sitting on it.
     */
    if (
      supportsHoverInteraction()
    ) {
      onDesktopEnter();

      return;
    }

    /*
     * Mobile / touch:
     *
     * ONE tap toggles it.
     */
    onActivate();
  }

  return (
    <button
      type="button"
      aria-label={`${tech.name} ${tech.level}%`}
      aria-pressed={active}
      onMouseEnter={
        handleMouseEnter
      }
      onMouseLeave={
        handleMouseLeave
      }
      onClick={
        handleClick
      }
      className="skills-orbit-tech"
      style={
        {
          "--orbit-angle":
            `${tech.angle}deg`,
        } as CSSProperties
      }
    >
      <span className="skills-orbit-tech-face">
        <span className="skills-orbit-tech-image">
          <Image
            src={tech.image}
            alt={tech.name}
            width={68}
            height={68}
            draggable={false}
            className="h-full w-full select-none object-contain"
          />
        </span>

        <span className="skills-orbit-tech-tooltip">
          {tech.name}
        </span>
      </span>
    </button>
  );
}

/* =========================================================
   TECH DETAIL
   ========================================================= */

function TechDetail({
  tech,
  language,
}: {
  tech: OrbitTech;

  language:
    | "en"
    | "am";
}) {
  return (
    <div className="skills-tech-detail">
      <div className="skills-tech-detail-head">
        <div className="skills-tech-detail-brand">
          <Image
            src={tech.image}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />

          <div>
            <p className="skills-tech-detail-name">
              {tech.name}
            </p>

            <p className="skills-tech-detail-level">
              {
                tech.levelLabel[
                  language
                ]
              }
            </p>
          </div>
        </div>

        <strong>
          {tech.level}%
        </strong>
      </div>

      <div className="skills-tech-detail-progress">
        <span
          style={{
            width: `${tech.level}%`,
          }}
        />
      </div>

      <p className="skills-tech-detail-description">
        {
          tech.description[
            language
          ]
        }
      </p>
    </div>
  );
}

/* =========================================================
   WORK CARD
   ========================================================= */

function WorkCard({
  step,
  isLast,
}: {
  step: WorkStep;
  isLast: boolean;
}) {
  const { language } =
    useLanguage();

  return (
    <div className="skills-work-step-wrap">
      <article className="skills-work-card">
        <div className="skills-work-icon-shell">
          <div className="skills-work-icon">
            <WorkIcon
              type={
                step.icon
              }
            />
          </div>

          <span className="skills-work-icon-base" />
        </div>

        <div className="skills-work-content">
          <span className="skills-work-number">
            {
              step.number
            }
          </span>

          <h3>
            {
              step.title[
                language
              ]
            }
          </h3>

          <p>
            {
              step.description[
                language
              ]
            }
          </p>
        </div>
      </article>

      {!isLast && (
        <div
          aria-hidden="true"
          className="skills-work-connector"
        >
          <span />
          <span />
          <span />

          <svg
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M3 2L8 6L3 10"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SKILLS SECTION
   ========================================================= */

export default function SkillsStackSection() {
  const { language } =
    useLanguage();

  const {
    mode: experienceMode,
  } = useExperienceMode();

  const isPerformance =
    experienceMode ===
    "performance";

  const [
    activeTech,
    setActiveTech,
  ] =
    useState<OrbitTech | null>(
      null,
    );

  const copy =
    language === "am"
      ? {
          eyebrow:
            "MY TOOLKIT",

          titleStart:
            "Skills &",

          titleAccent:
            "Stack",

          subtitle:
            "ከpolished frontend እስከ backend systems፣ databases፣ cloud deployment እና AI integrations — ሙሉ product ለመገንባት የምጠቀምባቸው ቴክኖሎጂዎች።",

          orbitHint:
            "Tech logo ላይ hover ወይም tap ያድርጉ",

          centerTop:
            "FULL-STACK",

          how:
            "How I",

          work:
            "Work",

          quality:
            "Interactive orbit",

          performance:
            "Optimized static mode",
        }
      : {
          eyebrow:
            "MY TOOLKIT",

          titleStart:
            "Skills &",

          titleAccent:
            "Stack",

          subtitle:
            "From polished frontend experiences to backend systems, databases, cloud deployment and AI integrations — the stack I use to turn ideas into complete products.",

          orbitHint:
            "Hover or tap a technology to inspect my experience",

          centerTop:
            "FULL-STACK",

          how:
            "How I",

          work:
            "Work",

          quality:
            "Interactive orbit",

          performance:
            "Optimized static mode",
        };

  /*
   * Desktop hover:
   * immediately show the selected technology.
   */
  function activateTech(
    tech: OrbitTech,
  ) {
    setActiveTech(
      tech,
    );
  }

  /*
   * Mobile:
   *
   * tap once -> open
   *
   * tap another -> switch
   *
   * tap selected one again -> close
   */
  function toggleTech(
    tech: OrbitTech,
  ) {
    setActiveTech(
      (current) => {
        if (
          current?.id ===
          tech.id
        ) {
          return null;
        }

        return tech;
      },
    );
  }

  return (
    <section
      id="skills"
      data-stack-mode={
        isPerformance
          ? "performance"
          : "quality"
      }
      className="skills-stack-section scroll-mt-24"
    >
      {/* ==========================================
          BACKGROUND
         ========================================== */}

      <div
        aria-hidden="true"
        className="skills-stack-bg-grid"
      />

      {!isPerformance && (
        <>
          <div
            aria-hidden="true"
            className="skills-stack-ambient skills-stack-ambient-one"
          />

          <div
            aria-hidden="true"
            className="skills-stack-ambient skills-stack-ambient-two"
          />
        </>
      )}

      <div className="skills-stack-container">
        {/* ==========================================
            HEADER
           ========================================== */}

        <header className="skills-stack-header">
          <div>
            <div className="skills-stack-eyebrow">
              <span />

              {copy.eyebrow}
            </div>

            <h2>
              {copy.titleStart}{" "}

              <span>
                {
                  copy.titleAccent
                }
              </span>
            </h2>

            <p>
              {copy.subtitle}
            </p>
          </div>

          <div className="skills-stack-mode-pill">
            <span
              className={
                isPerformance
                  ? "skills-stack-mode-dot skills-stack-mode-dot--performance"
                  : "skills-stack-mode-dot"
              }
            />

            {isPerformance
              ? copy.performance
              : copy.quality}
          </div>
        </header>

        {/* ==========================================
            MAIN SKILL MAP
           ========================================== */}

        <div className="skills-stack-map">
          {/* LEFT SIDE */}

          <div className="skills-stack-side skills-stack-side--left">
            {categories
              .slice(0, 2)
              .map(
                (
                  category,
                ) => (
                  <SummaryCard
                    key={
                      category.title.en
                    }
                    category={
                      category
                    }
                  />
                ),
              )}
          </div>

          {/* ==========================================
              ORBIT
             ========================================== */}

          <div className="skills-orbit-column">
            <div
              className="skills-orbit-stage"
              data-paused={
                activeTech
                  ? "true"
                  : "false"
              }
            >
              {/* ORBIT RINGS */}

              <div className="skills-orbit-ring skills-orbit-ring--outer" />

              <div className="skills-orbit-ring skills-orbit-ring--middle" />

              <div className="skills-orbit-ring skills-orbit-ring--inner" />

              {/* QUALITY MODE PARTICLES */}

              {!isPerformance && (
                <>
                  <div className="skills-orbit-node-track skills-orbit-node-track--one">
                    <span className="skills-orbit-node skills-orbit-node--1" />
                    <span className="skills-orbit-node skills-orbit-node--2" />
                    <span className="skills-orbit-node skills-orbit-node--3" />
                    <span className="skills-orbit-node skills-orbit-node--4" />
                  </div>

                  <div className="skills-orbit-node-track skills-orbit-node-track--two">
                    <span className="skills-orbit-node skills-orbit-node--5" />
                    <span className="skills-orbit-node skills-orbit-node--6" />
                    <span className="skills-orbit-node skills-orbit-node--7" />
                  </div>
                </>
              )}

              {/* ==========================================
                  TECHNOLOGIES
                 ========================================== */}

              <div className="skills-orbit-spinner">
                {orbitTech.map(
                  (tech) => (
                    <OrbitTechButton
                      key={
                        tech.id
                      }
                      tech={
                        tech
                      }
                      active={
                        activeTech?.id ===
                        tech.id
                      }
                      onDesktopEnter={() => {
                        activateTech(
                          tech,
                        );
                      }}
                      onDesktopLeave={() => {
                        /*
                         * Only a real hover device can ever
                         * trigger this callback.
                         */
                        setActiveTech(
                          null,
                        );
                      }}
                      onActivate={() => {
                        /*
                         * Touch/mobile only.
                         */
                        toggleTech(
                          tech,
                        );
                      }}
                    />
                  ),
                )}
              </div>

              {/* ==========================================
                  CENTER CORE
                 ========================================== */}

              <div className="skills-orbit-core">
                <div className="skills-orbit-core-top">
                  {
                    copy.centerTop
                  }
                </div>

                <strong>
                  BAKI
                </strong>

                <span className="skills-orbit-code">
                  &lt;/&gt;
                </span>

                <span className="skills-orbit-core-status">
                  <i />

                  BUILDING
                </span>
              </div>
            </div>

            {/* ==========================================
                TECHNOLOGY DETAIL
               ========================================== */}

            <div className="skills-orbit-detail-area">
              {activeTech ? (
                <TechDetail
                  tech={
                    activeTech
                  }
                  language={
                    language
                  }
                />
              ) : (
                <div className="skills-orbit-hint">
                  <span className="skills-orbit-hint-icon">
                    +
                  </span>

                  {
                    copy.orbitHint
                  }
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE */}

          <div className="skills-stack-side skills-stack-side--right">
            {categories
              .slice(2)
              .map(
                (
                  category,
                ) => (
                  <SummaryCard
                    key={
                      category.title.en
                    }
                    category={
                      category
                    }
                  />
                ),
              )}
          </div>
        </div>

        {/* ==========================================
            MOBILE CATEGORY CARDS
           ========================================== */}

        <div className="skills-stack-mobile-categories">
          {categories.map(
            (category) => (
              <SummaryCard
                key={
                  category.title.en
                }
                category={
                  category
                }
              />
            ),
          )}
        </div>

        {/* ==========================================
            HOW I WORK
           ========================================== */}

        <div className="skills-work">
          <div className="skills-work-heading">
            <h2>
              {copy.how}{" "}

              <span>
                {copy.work}
              </span>
            </h2>

            <span className="skills-work-heading-line" />
          </div>

          <div className="skills-work-grid">
            {workSteps.map(
              (
                step,
                index,
              ) => (
                <WorkCard
                  key={
                    step.number
                  }
                  step={
                    step
                  }
                  isLast={
                    index ===
                    workSteps.length -
                      1
                  }
                />
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}