"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import ProjectCard from "@/components/projects/project-card";

import {
  useLanguage,
} from "@/components/providers/language-provider";

import {
  getFeaturedProjects,
  type Project,
} from "@/lib/projects";

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
  const {
    language,
  } = useLanguage();

  const [
    projects,
    setProjects,
  ] =
    useState<Project[]>(
      [],
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    failed,
    setFailed,
  ] = useState(false);

  useEffect(() => {
    let cancelled =
      false;

    async function loadProjects() {
      try {
        const result =
          await getFeaturedProjects();

        if (
          cancelled
        ) {
          return;
        }

        setProjects(
          result,
        );

        setFailed(
          false,
        );
      } catch (
        error
      ) {
        console.error(
          "Unable to load featured projects:",
          error,
        );

        if (
          !cancelled
        ) {
          setFailed(
            true,
          );
        }
      } finally {
        if (
          !cancelled
        ) {
          setLoading(
            false,
          );
        }
      }
    }

    void loadProjects();

    return () => {
      cancelled =
        true;
    };
  }, []);

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

          empty:
            "እስካሁን featured project የለም።",

          error:
            "ፕሮጀክቶችን መጫን አልተቻለም።",
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

          empty:
            "No featured projects yet.",

          error:
            "Unable to load projects.",
        };

  return (
    <section
      id="projects"
      className="scroll-mt-24 overflow-hidden bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-[1450px]">
        <div className="mb-10 flex items-end justify-between gap-8 sm:mb-12">
          <div className="max-w-[700px]">
            <div className="mb-3 flex items-center gap-3">
              <span className="h-[1px] w-7 bg-[#507d33]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#507d33]">
                {
                  copy.eyebrow
                }
              </span>
            </div>

            <h2 className="text-[36px] font-bold tracking-[-0.055em] text-[#161914] sm:text-[46px] lg:text-[54px]">
              {
                copy.title
              }
            </h2>

            <p className="mt-4 max-w-[590px] text-[13px] leading-6 text-black/45 sm:text-[15px] sm:leading-7">
              {
                copy.description
              }
            </p>
          </div>

          <Link
            href="/projects"
            className="group hidden shrink-0 items-center gap-2 text-[13px] font-bold text-[#4b792f] transition-colors duration-300 hover:text-[#31581d] sm:flex"
          >
            {
              copy.viewAll
            }

            <span className="transition-transform duration-300 group-hover:translate-x-1">
              <ArrowIcon />
            </span>
          </Link>
        </div>

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-black/[0.08] border-t-[#426c2b]" />
          </div>
        ) : failed ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-[24px] border border-black/[0.06] bg-[#fafbf8] text-[11px] text-black/35">
            {
              copy.error
            }
          </div>
        ) : projects.length ===
          0 ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-[24px] border border-dashed border-black/[0.08] bg-[#fafbf8] text-[11px] text-black/35">
            {
              copy.empty
            }
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-7">
            {projects.map(
              (
                project,
              ) => (
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
        )}

        <Link
          href="/projects"
          className="group mt-8 flex h-12 items-center justify-center gap-2 rounded-xl border border-[#4b792f]/15 bg-[#f4f8f1] text-[12px] font-bold text-[#4b792f] sm:hidden"
        >
          {
            copy.viewAll
          }

          <ArrowIcon />
        </Link>
      </div>
    </section>
  );
}