import About from "@/components/home/about";
import Hero from "@/components/home/hero";
import ProjectsSection from "@/components/home/projects";
import SkillsFlowSection from "@/components/home/skills";
import SkillsStackSection from "@/components/home/skills-stack";

import Navbar from "@/components/layout/navbar";

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main className="w-full overflow-x-hidden">
        <Hero />

        <About />

        <ProjectsSection />

        {/* NEW REAL SKILLS SECTION */}
        <SkillsStackSection />

        {/* OLD LIQUID FLOW — NOW EXPERIENCE */}
        <SkillsFlowSection />

        <section
          id="contact"
          className="min-h-[300px] scroll-mt-24 bg-[#f8f8f4]"
        />
      </main>
    </>
  );
}