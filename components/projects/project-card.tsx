"use client";

import Image from "next/image";
import Link from "next/link";

import { useLanguage } from "@/components/providers/language-provider";

import type { Project } from "@/lib/projects";

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

export default function ProjectCard({
  project,
}: {
  project: Project;
}) {
  const { language } =
    useLanguage();

  const labels =
    language === "am"
      ? {
          caseStudy:
            "ፕሮጀክቱን በዝርዝር ይመልከቱ",
          imageAlt: `${project.title} ፕሮጀክት`,
        }
      : {
          caseStudy:
            "View Case Study",
          imageAlt: `${project.title} project`,
        };

  return (
    <Link
      href={`/projects/${project.slug}`}
      className={`
        group
        relative
        block
        overflow-hidden

        rounded-[24px]

        border
        border-black/[0.07]

        bg-white

        shadow-[0_12px_45px_rgba(31,43,25,0.06)]

        transition-all
        duration-500

        ease-[cubic-bezier(0.22,1,0.36,1)]

        hover:-translate-y-2
        hover:border-[#5f8b43]/20

        hover:shadow-[0_24px_65px_rgba(42,67,29,0.12)]
      `}
    >
      {/* THUMBNAIL */}

      <div
        className={`
          relative
          aspect-[16/10]
          overflow-hidden

          border-b
          border-black/[0.06]

          bg-[#f4f5f0]
        `}
      >
        <Image
          fill
          src={project.thumbnail}
          alt={labels.imageAlt}
          sizes="(max-width: 768px) 100vw, 50vw"
          className={`
            object-cover

            transition-transform
            duration-700

            ease-[cubic-bezier(0.22,1,0.36,1)]

            group-hover:scale-[1.035]
          `}
        />

        <div
          className={`
            pointer-events-none

            absolute
            inset-0

            bg-gradient-to-t
            from-black/[0.08]
            via-transparent
            to-transparent

            opacity-0

            transition-opacity
            duration-500

            group-hover:opacity-100
          `}
        />

        {/* FLOATING OPEN BUTTON */}

        <div
          className={`
            absolute
            right-4
            top-4

            flex
            h-10
            w-10
            items-center
            justify-center

            rounded-full

            border
            border-white/50

            bg-white/90

            text-[#426c2b]

            shadow-[0_10px_30px_rgba(0,0,0,0.12)]

            backdrop-blur-xl

            transition-all
            duration-500

            group-hover:rotate-[-5deg]
            group-hover:scale-110
          `}
        >
          ↗
        </div>
      </div>

      {/* CONTENT */}

      <div className="p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-[1px] w-5 bg-[#548236]" />

          <p
            className={`
              text-[10px]
              font-bold
              uppercase
              tracking-[0.15em]

              text-[#548236]
            `}
          >
            {
              project.category[
                language
              ]
            }
          </p>
        </div>

        <h3
          className={`
            text-[23px]
            font-bold
            tracking-[-0.045em]

            text-[#161914]

            transition-colors
            duration-300

            group-hover:text-[#426c2b]

            sm:text-[26px]
          `}
        >
          {project.title}
        </h3>

        <p
          className={`
            mt-2
            max-w-[600px]

            text-[13px]
            leading-6
            text-black/48

            sm:text-[14px]
          `}
        >
          {
            project.shortDescription[
              language
            ]
          }
        </p>

        {/* TECHNOLOGIES */}

        <div className="mt-5 flex flex-wrap gap-2">
          {project.technologies
            .slice(0, 4)
            .map(
              (
                technology,
              ) => (
                <span
                  key={
                    technology
                  }
                  className={`
                    rounded-lg

                    border
                    border-black/[0.05]

                    bg-[#f6f7f3]

                    px-2.5
                    py-1.5

                    text-[10px]
                    font-semibold
                    text-black/48

                    sm:text-[11px]
                  `}
                >
                  {
                    technology
                  }
                </span>
              ),
            )}
        </div>

        {/* CASE STUDY */}

        <div
          className={`
            mt-6

            flex
            items-center
            gap-2

            text-[12px]
            font-bold
            text-[#4b792f]

            sm:text-[13px]
          `}
        >
          <span>
            {
              labels.caseStudy
            }
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
        </div>
      </div>
    </Link>
  );
}