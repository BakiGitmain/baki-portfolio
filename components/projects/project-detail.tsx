"use client";

import Image from "next/image";
import Link from "next/link";

import { useLanguage } from "@/components/providers/language-provider";

import type { Project } from "@/lib/projects";

function ExternalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M8 16L16 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M9 8H16V15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProjectDetail({
  project,
}: {
  project: Project;
}) {
  const { language } =
    useLanguage();

  const copy =
    language === "am"
      ? {
          back:
            "ሁሉም ፕሮጀክቶች",

          overview:
            "ስለ ፕሮጀክቱ",

          challenge:
            "ፈተናው",

          solution:
            "መፍትሄው",

          howItWorks:
            "እንዴት ይሰራል",

          features:
            "ዋና ባህሪያት",

          technologies:
            "ቴክኖሎጂዎች",

          year: "ዓመት",

          role: "የእኔ ስራ",

          status: "ሁኔታ",

          live:
            "Live Website",

        }
      : {
          back:
            "All Projects",

          overview:
            "Project Overview",

          challenge:
            "The Challenge",

          solution:
            "The Solution",

          howItWorks:
            "How It Works",

          features:
            "Key Features",

          technologies:
            "Technologies",

          year: "Year",

          role: "My Role",

          status: "Status",

          live:
            "Live Website",

        };

  return (
    <main
      className={`
        min-h-screen

        overflow-hidden

        bg-[#f8f8f4]

        pb-24
      `}
    >
      {/* HERO */}

      <section
        className={`
          px-4
          pb-14
          pt-10

          sm:px-6
          sm:pb-20
          sm:pt-16

          lg:px-8
        `}
      >
        <div className="mx-auto max-w-[1450px]">
          <Link
            href="/projects"
            className={`
              inline-flex

              items-center
              gap-2

              text-[12px]
              font-semibold

              text-black/45

              transition-colors

              hover:text-[#4b792f]
            `}
          >
            <span>←</span>

            <span>
              {copy.back}
            </span>
          </Link>

          <div
            className={`
              mt-12

              grid
              gap-10

              lg:grid-cols-[0.9fr_1.1fr]
              lg:items-end
            `}
          >
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="h-[1px] w-7 bg-[#4d7a30]" />

                <span
                  className={`
                    text-[10px]
                    font-bold

                    uppercase
                    tracking-[0.17em]

                    text-[#4d7a30]
                  `}
                >
                  {
                    project.category[
                      language
                    ]
                  }
                </span>
              </div>

              <h1
                className={`
                  max-w-[700px]

                  text-[48px]
                  font-bold

                  leading-[0.95]

                  tracking-[-0.065em]

                  text-[#141713]

                  sm:text-[66px]
                  lg:text-[78px]
                `}
              >
                {project.title}
              </h1>

              <p
                className={`
                  mt-6
                  max-w-[650px]

                  text-[14px]
                  leading-7

                  text-black/48

                  sm:text-[16px]
                  sm:leading-8
                `}
              >
                {
                  project.description[
                    language
                  ]
                }
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                {project.liveUrl && (
                  <a
                    href={
                      project.liveUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className={`
                      inline-flex
                      h-12

                      items-center
                      gap-2

                      rounded-xl

                      bg-[#356521]

                      px-5

                      text-[12px]
                      font-bold

                      text-white

                      shadow-[0_14px_30px_rgba(53,101,33,0.18)]

                      transition-all

                      hover:-translate-y-0.5
                      hover:bg-[#2d581b]
                    `}
                  >
                    <span>
                      {copy.live}
                    </span>

                    <ExternalIcon />
                  </a>
                )}

              </div>
            </div>

            {/* PROJECT INFO */}

            <div
              className={`
                grid
                grid-cols-3

                overflow-hidden

                rounded-[20px]

                border
                border-black/[0.07]

                bg-white

                shadow-[0_15px_45px_rgba(34,45,28,0.05)]
              `}
            >
              <div className="p-4 sm:p-6">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-black/30">
                  {copy.year}
                </p>

                <p className="mt-2 text-[12px] font-bold text-[#171a15] sm:text-[14px]">
                  {
                    project.year
                  }
                </p>
              </div>

              <div className="border-l border-black/[0.06] p-4 sm:p-6">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-black/30">
                  {copy.role}
                </p>

                <p className="mt-2 text-[11px] font-bold leading-5 text-[#171a15] sm:text-[13px]">
                  {
                    project.role[
                      language
                    ]
                  }
                </p>
              </div>

              <div className="border-l border-black/[0.06] p-4 sm:p-6">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-black/30">
                  {copy.status}
                </p>

                <p className="mt-2 text-[11px] font-bold leading-5 text-[#4b792f] sm:text-[13px]">
                  {
                    project.status[
                      language
                    ]
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN THUMBNAIL */}

      <section className="px-4 sm:px-6 lg:px-8">
        <div
          className={`
            relative

            mx-auto

            aspect-[16/10]
            max-w-[1450px]

            overflow-hidden

            rounded-[22px]

            border
            border-black/[0.07]

            bg-white

            shadow-[0_25px_70px_rgba(28,42,21,0.10)]

            sm:rounded-[30px]
          `}
        >
          <Image
            fill
            priority
            src={project.thumbnail}
            alt={`${project.title} project`}
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </section>

      {/* OVERVIEW */}

      <section
        className={`
          px-4
          py-20

          sm:px-6
          sm:py-28

          lg:px-8
        `}
      >
        <div
          className={`
            mx-auto
            grid
            max-w-[1200px]
            gap-14

            lg:grid-cols-2
            lg:gap-24
          `}
        >
          <article>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#4e7c31]">
              01
            </p>

            <h2
              className={`
                mt-3

                text-[30px]
                font-bold

                tracking-[-0.045em]

                text-[#151813]

                sm:text-[38px]
              `}
            >
              {copy.overview}
            </h2>

            <p className="mt-5 text-[14px] leading-7 text-black/50 sm:text-[15px] sm:leading-8">
              {
                project.overview[
                  language
                ]
              }
            </p>
          </article>

          <article>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#4e7c31]">
              02
            </p>

            <h2
              className={`
                mt-3

                text-[30px]
                font-bold

                tracking-[-0.045em]

                text-[#151813]

                sm:text-[38px]
              `}
            >
              {copy.challenge}
            </h2>

            <p className="mt-5 text-[14px] leading-7 text-black/50 sm:text-[15px] sm:leading-8">
              {
                project.challenge[
                  language
                ]
              }
            </p>
          </article>
        </div>
      </section>

      {/* SOLUTION */}

      <section className="px-4 sm:px-6 lg:px-8">
        <div
          className={`
            mx-auto
            max-w-[1200px]

            rounded-[28px]

            border
            border-[#4e7c31]/10

            bg-[#eef5e9]

            p-7

            sm:p-10
            lg:p-14
          `}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#4e7c31]">
            03
          </p>

          <h2 className="mt-3 text-[30px] font-bold tracking-[-0.045em] text-[#151813] sm:text-[40px]">
            {copy.solution}
          </h2>

          <p
            className={`
              mt-5
              max-w-[850px]

              text-[14px]
              leading-7

              text-black/55

              sm:text-[16px]
              sm:leading-8
            `}
          >
            {
              project.solution[
                language
              ]
            }
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}

      <section
        className={`
          px-4
          py-20

          sm:px-6
          sm:py-28

          lg:px-8
        `}
      >
        <div className="mx-auto max-w-[1200px]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#4e7c31]">
            04
          </p>

          <h2 className="mt-3 text-[32px] font-bold tracking-[-0.05em] text-[#151813] sm:text-[44px]">
            {copy.howItWorks}
          </h2>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {project.howItWorks.map(
              (
                step,
                index,
              ) => (
                <article
                  key={
                    step.title.en
                  }
                  className={`
                    rounded-[20px]

                    border
                    border-black/[0.06]

                    bg-white

                    p-6

                    shadow-[0_10px_35px_rgba(34,45,28,0.04)]

                    sm:p-7
                  `}
                >
                  <span
                    className={`
                      flex
                      h-9
                      w-9

                      items-center
                      justify-center

                      rounded-full

                      bg-[#edf5e8]

                      text-[11px]
                      font-bold

                      text-[#4e7c31]
                    `}
                  >
                    {String(
                      index + 1,
                    ).padStart(
                      2,
                      "0",
                    )}
                  </span>

                  <h3 className="mt-5 text-[18px] font-bold tracking-[-0.025em] text-[#181b16]">
                    {
                      step.title[
                        language
                      ]
                    }
                  </h3>

                  <p className="mt-2 text-[13px] leading-6 text-black/45">
                    {
                      step.description[
                        language
                      ]
                    }
                  </p>
                </article>
              ),
            )}
          </div>
        </div>
      </section>

      {/* FEATURES + STACK */}

      <section className="px-4 sm:px-6 lg:px-8">
        <div
          className={`
            mx-auto

            grid
            max-w-[1200px]
            gap-6

            lg:grid-cols-2
          `}
        >
          <div
            className={`
              rounded-[24px]

              border
              border-black/[0.06]

              bg-white

              p-7

              sm:p-9
            `}
          >
            <h2 className="text-[24px] font-bold tracking-[-0.04em] text-[#161914]">
              {copy.features}
            </h2>

            <div className="mt-7 space-y-4">
              {project.features.map(
                (
                  feature,
                ) => (
                  <div
                    key={
                      feature.en
                    }
                    className="flex items-center gap-3"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#75ad4f]" />

                    <p className="text-[13px] text-black/55">
                      {
                        feature[
                          language
                        ]
                      }
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>

          <div
            className={`
              rounded-[24px]

              border
              border-black/[0.06]

              bg-[#192017]

              p-7

              sm:p-9
            `}
          >
            <h2 className="text-[24px] font-bold tracking-[-0.04em] text-white">
              {
                copy.technologies
              }
            </h2>

            <div className="mt-7 flex flex-wrap gap-2">
              {project.technologies.map(
                (
                  technology,
                ) => (
                  <span
                    key={
                      technology
                    }
                    className={`
                      rounded-xl

                      border
                      border-white/10

                      bg-white/[0.06]

                      px-3
                      py-2

                      text-[12px]
                      font-semibold

                      text-white/65
                    `}
                  >
                    {
                      technology
                    }
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}