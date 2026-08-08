import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import Navbar from "@/components/layout/navbar";

import ProjectDetail from "@/components/projects/project-detail";

import {
  getProjectBySlug,
} from "@/lib/projects";

type ProjectPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic =
  "force-dynamic";

/* =========================================================
   METADATA
   ========================================================= */

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const {
    slug,
  } =
    await params;

  try {
    const project =
      await getProjectBySlug(
        slug,
      );

    if (!project) {
      return {
        title:
          "Project Not Found | Baki",
      };
    }

    return {
      title:
        `${project.title.en} | Baki Projects`,

      description:
        project.shortDescription.en,

      openGraph: {
        title:
          `${project.title.en} | Baki Projects`,

        description:
          project.shortDescription.en,

        images: [
          {
            url:
              project.thumbnail,

            alt:
              project.title.en,
          },
        ],
      },
    };
  } catch (
    error
  ) {
    console.error(
      "Failed to generate project metadata:",
      error,
    );

    return {
      title:
        "Project | Baki",
    };
  }
}

/* =========================================================
   PAGE
   ========================================================= */

export default async function ProjectPage({
  params,
}: ProjectPageProps) {
  const {
    slug,
  } =
    await params;

  let project;

  try {
    project =
      await getProjectBySlug(
        slug,
      );
  } catch (
    error
  ) {
    console.error(
      "Failed to load project:",
      error,
    );

    notFound();
  }

  if (!project) {
    notFound();
  }

  return (
    <>
      <Navbar />

      <ProjectDetail
        project={
          project
        }
      />
    </>
  );
}