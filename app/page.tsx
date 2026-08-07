import About from "@/components/home/about";
import Hero from "@/components/home/hero";
import ProjectsSection from "@/components/home/projects";
import SkillsSection from "@/components/home/skills";

import Navbar from "@/components/layout/navbar";

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main className="w-full overflow-x-hidden">
        <Hero />

        <About />

        <ProjectsSection />

        <SkillsSection />

        <section
          id="experience"
          className="min-h-[300px] scroll-mt-24 bg-white"
        />

        <section
          id="contact"
          className="min-h-[300px] scroll-mt-24 bg-[#f8f8f4]"
        />
      </main>
    </>
  );
}