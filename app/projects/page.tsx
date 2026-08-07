import type { Metadata } from "next";

import Navbar from "@/components/layout/navbar";

import ProjectsGrid from "@/components/projects/projects-grid";

export const metadata: Metadata = {
  title:
    "Projects | Baki",

  description:
    "Explore full-stack web applications and digital products designed and built by Baki.",
};

export default function ProjectsPage() {
  return (
    <>
      <Navbar />

      <ProjectsGrid />
    </>
  );
}