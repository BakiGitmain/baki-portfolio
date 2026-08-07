import type { Metadata } from "next";

import { notFound } from "next/navigation";

import Navbar from "@/components/layout/navbar";

import ProjectDetail from "@/components/projects/project-detail";

import {
  getProjectBySlug,
  projects,
} from "@/lib/projects";

type ProjectPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return projects.map(
    (project) => ({
      slug: project.slug,
    }),
  );
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } =
    await params;

  const project =
    getProjectBySlug(slug);

  if (!project) {
    return {
      title:
        "Project Not Found | Baki",
    };
  }

  return {
    title: `${project.title} | Baki Projects`,

    description:
      project.shortDescription.en,
  };
}

export default async function ProjectPage({
  params,
}: ProjectPageProps) {
  const { slug } =
    await params;

  const project =
    getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <>
      <Navbar />

      <ProjectDetail
        project={project}
      />
    </>
  );
}