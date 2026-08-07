"use client";

import Link from "next/link";

import ProjectCard from "@/components/projects/project-card";

import { useLanguage } from "@/components/providers/language-provider";

import { getFeaturedProjects } from "@/lib/projects";

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M5 12H19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M14 7L19 12L14 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProjectsSection() {
  const { language } =
    useLanguage();

  const featuredProjects =
    getFeaturedProjects();

  const copy =
    language === "am"
      ? {
          eyebrow:
            "የተመረጡ ፕሮጀክቶች",

          title:
            "Featured Projects",

          description:
            "ከዲዛይን እስከ backend systems ድረስ የገነባኋቸው ሙሉ ዲጂታል ምርቶች።",

          viewAll:
            "ሁሉንም ፕሮጀክቶች ይመልከቱ",
        }
      : {
          eyebrow:
            "SELECTED WORK",

          title:
            "Featured Projects",

          description:
            "Full-stack products I've designed and built from polished interfaces to the systems working behind them.",

          viewAll:
            "View all projects",
        };

  return (
    <section
      id="projects"
      className={`
        scroll-mt-24

        overflow-hidden

        bg-white

        px-4
        py-20

        sm:px-6
        sm:py-24

        lg:px-8
        lg:py-28
      `}
    >
      <div className="mx-auto max-w-[1450px]">
        {/* HEADER */}

        <div
          className={`
            mb-10

            flex
            items-end
            justify-between
            gap-8

            sm:mb-12
          `}
        >
          <div className="max-w-[700px]">
            <div className="mb-3 flex items-center gap-3">
              <span className="h-[1px] w-7 bg-[#507d33]" />

              <span
                className={`
                  text-[10px]
                  font-bold

                  uppercase
                  tracking-[0.18em]

                  text-[#507d33]
                `}
              >
                {copy.eyebrow}
              </span>
            </div>

            <h2
              className={`
                text-[36px]
                font-bold

                tracking-[-0.055em]

                text-[#161914]

                sm:text-[46px]
                lg:text-[54px]
              `}
            >
              {copy.title}
            </h2>

            <p
              className={`
                mt-4
                max-w-[590px]

                text-[13px]
                leading-6

                text-black/45

                sm:text-[15px]
                sm:leading-7
              `}
            >
              {copy.description}
            </p>
          </div>

          <Link
            href="/projects"
            className={`
              group

              hidden
              shrink-0

              items-center
              gap-2

              text-[13px]
              font-bold

              text-[#4b792f]

              transition-colors
              duration-300

              hover:text-[#31581d]

              sm:flex
            `}
          >
            <span>
              {copy.viewAll}
            </span>

            <span
              className={`
                transition-transform
                duration-300

                group-hover:translate-x-1
              `}
            >
              <ArrowIcon />
            </span>
          </Link>
        </div>

        {/* PROJECTS */}

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-7">
          {featuredProjects.map(
            (project) => (
              <ProjectCard
                key={
                  project.slug
                }
                project={
                  project
                }
              />
            ),
          )}
        </div>

        {/* MOBILE VIEW ALL */}

        <Link
          href="/projects"
          className={`
            group

            mt-8

            flex
            h-12

            items-center
            justify-center
            gap-2

            rounded-xl

            border
            border-[#4b792f]/15

            bg-[#f4f8f1]

            text-[12px]
            font-bold

            text-[#4b792f]

            sm:hidden
          `}
        >
          <span>
            {copy.viewAll}
          </span>

          <ArrowIcon />
        </Link>
      </div>
    </section>
  );
}