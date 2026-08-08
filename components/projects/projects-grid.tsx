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
  getProjects,
  type Project,
} from "@/lib/projects";

export default function ProjectsGrid() {
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
          await getProjects();

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
          "Unable to load projects:",
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
            "ፕሮጀክቶቼ",

          title:
            "ሁሉም ፕሮጀክቶች",

          description:
            "የገነባኋቸውን web applications፣ full-stack systems እና digital products ይመልከቱ።",

          back:
            "ወደ መነሻ ተመለስ",

          empty:
            "እስካሁን published project የለም።",

          error:
            "ፕሮጀክቶችን መጫን አልተቻለም።",
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

          empty:
            "No published projects yet.",

          error:
            "Unable to load projects.",
        };

  return (
    <main className="min-h-screen bg-[#f8f8f4] px-4 pb-24 pt-14 sm:px-6 sm:pt-20 lg:px-8">
      <div className="mx-auto max-w-[1450px]">
        <Link
          href="/#projects"
          className="inline-flex items-center gap-2 text-[12px] font-semibold text-black/45 transition-colors hover:text-[#4b792f]"
        >
          ←{" "}
          {
            copy.back
          }
        </Link>

        <header className="pb-12 pt-12 sm:pb-16 sm:pt-16">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-[1px] w-7 bg-[#507d33]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#507d33]">
              {
                copy.eyebrow
              }
            </span>
          </div>

          <h1 className="max-w-[850px] text-[44px] font-bold tracking-[-0.06em] text-[#151713] sm:text-[60px] lg:text-[72px]">
            {
              copy.title
            }
          </h1>

          <p className="mt-5 max-w-[650px] text-[14px] leading-7 text-black/45 sm:text-[16px]">
            {
              copy.description
            }
          </p>
        </header>

        {loading ? (
          <div className="flex min-h-[380px] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-black/[0.08] border-t-[#426c2b]" />
          </div>
        ) : failed ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-[24px] border border-black/[0.06] bg-white/50 text-[11px] text-black/35">
            {
              copy.error
            }
          </div>
        ) : projects.length ===
          0 ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-[24px] border border-dashed border-black/[0.08] bg-white/50 text-[11px] text-black/35">
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
      </div>
    </main>
  );
}