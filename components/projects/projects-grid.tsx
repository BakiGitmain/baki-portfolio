"use client";

import Link from "next/link";

import ProjectCard from "@/components/projects/project-card";

import { useLanguage } from "@/components/providers/language-provider";

import { projects } from "@/lib/projects";

export default function ProjectsGrid() {
  const { language } =
    useLanguage();

  const copy =
    language === "am"
      ? {
          eyebrow:
            "ፕሮጀክቶቼ",

          title:
            "ሁሉም ፕሮጀክቶች",

          description:
            "የገነባኋቸውን የweb፣ full-stack እና digital product ፕሮጀክቶች ይመልከቱ።",

          back:
            "ወደ መነሻ ተመለስ",
        }
      : {
          eyebrow:
            "MY WORK",

          title:
            "All Projects",

          description:
            "A collection of web applications, full-stack systems and digital products I've designed and built.",

          back:
            "Back to home",
        };

  return (
    <main
      className={`
        min-h-screen

        bg-[#f8f8f4]

        px-4
        pb-24
        pt-14

        sm:px-6
        sm:pt-20

        lg:px-8
      `}
    >
      <div className="mx-auto max-w-[1450px]">
        <Link
          href="/#projects"
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

        <header
          className={`
            pb-12
            pt-12

            sm:pb-16
            sm:pt-16
          `}
        >
          <div className="mb-4 flex items-center gap-3">
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

          <h1
            className={`
              max-w-[850px]

              text-[44px]
              font-bold

              tracking-[-0.06em]

              text-[#151713]

              sm:text-[60px]
              lg:text-[72px]
            `}
          >
            {copy.title}
          </h1>

          <p
            className={`
              mt-5
              max-w-[650px]

              text-[14px]
              leading-7

              text-black/45

              sm:text-[16px]
            `}
          >
            {copy.description}
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-7">
          {projects.map(
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
      </div>
    </main>
  );
}