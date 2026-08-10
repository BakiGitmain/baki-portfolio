
import About from "@/components/home/about";

import ContactSection from "@/components/home/contact";

import Hero from "@/components/home/hero";

import HireCTA from "@/components/home/hire-cta";

import ProjectsSection from "@/components/home/projects";

import SkillsFlowSection from "@/components/home/skills";

import SkillsStackSection from "@/components/home/skills-stack";

import Footer from "@/components/layout/footer";

import Navbar from "@/components/layout/navbar";

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main className="w-full overflow-x-hidden">
        <Hero />

        <About />

        <ProjectsSection />

        <SkillsStackSection />

        <SkillsFlowSection />

        <HireCTA />

        <ContactSection />
      </main>

      <Footer />


    </>
  );
}