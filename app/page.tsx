import About from "@/components/home/about";
import Hero from "@/components/home/hero";
import Navbar from "@/components/layout/navbar";

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main className="w-full overflow-x-hidden">
        <Hero />

        <About />

        <section
          id="projects"
          className="min-h-[300px] scroll-mt-24 bg-white"
        />

        <section
          id="skills"
          className="min-h-[300px] scroll-mt-24 bg-[#f8f8f4]"
        />

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