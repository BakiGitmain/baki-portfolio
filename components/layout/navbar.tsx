"use client";

import { useEffect, useState } from "react";

import LanguageToggle from "@/components/layout/language-toggle";
import { useLanguage } from "@/components/providers/language-provider";

const sectionIds = [
  "home",
  "about",
  "projects",
  "skills",
  "experience",
  "contact",
] as const;

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-5 w-6">
      <span
        className={`absolute left-0 top-[3px] h-[2px] w-6 rounded-full bg-current transition-all duration-300 ${
          open ? "translate-y-[7px] rotate-45" : ""
        }`}
      />

      <span
        className={`absolute left-0 top-[10px] h-[2px] w-6 rounded-full bg-current transition-all duration-300 ${
          open
            ? "scale-x-0 opacity-0"
            : "scale-x-100 opacity-100"
        }`}
      />

      <span
        className={`absolute bottom-[2px] left-0 h-[2px] w-6 rounded-full bg-current transition-all duration-300 ${
          open ? "-translate-y-[7px] -rotate-45" : ""
        }`}
      />
    </span>
  );
}

export default function Navbar() {
  const { copy } = useLanguage();

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [isScrolled, setIsScrolled] = useState(false);

  const navigationLinks = [
    {
      label: copy.nav.home,
      href: "#home",
      id: "home",
    },
    {
      label: copy.nav.about,
      href: "#about",
      id: "about",
    },
    {
      label: copy.nav.projects,
      href: "#projects",
      id: "projects",
    },
    {
      label: copy.nav.skills,
      href: "#skills",
      id: "skills",
    },
    {
      label: copy.nav.experience,
      href: "#experience",
      id: "experience",
    },
    {
      label: copy.nav.contact,
      href: "#contact",
      id: "contact",
    },
  ];

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 20);
    }

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const sections = sectionIds
      .map((sectionId) =>
        document.getElementById(sectionId),
      )
      .filter(
        (section): section is HTMLElement =>
          Boolean(section),
      );

    if (sections.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (first, second) =>
              second.intersectionRatio -
              first.intersectionRatio,
          );

        const visibleSection = visibleEntries[0];

        if (visibleSection) {
          setActiveSection(visibleSection.target.id);
        }
      },
      {
        rootMargin: "-25% 0px -60% 0px",
        threshold: [0.01, 0.1, 0.25, 0.5],
      },
    );

    sections.forEach((section) => {
      observer.observe(section);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  function handleNavigation(sectionId: string) {
    setActiveSection(sectionId);
    setMenuOpen(false);
  }

  return (
    <header
      className={`sticky top-0 z-[100] border-b transition-all duration-500 ${
        isScrolled
          ? "border-black/[0.07] bg-[#f8f8f4]/90 shadow-[0_12px_40px_rgba(28,42,20,0.07)] backdrop-blur-2xl"
          : "border-black/[0.04] bg-[#f8f8f4]/75 backdrop-blur-xl"
      }`}
    >
      <nav
        className={`mx-auto flex w-full max-w-[1500px] items-center justify-between px-4 transition-all duration-500 sm:px-8 lg:px-12 ${
          isScrolled ? "h-[68px]" : "h-[82px]"
        }`}
      >
        <a
          href="#home"
          onClick={() => handleNavigation("home")}
          className="group flex shrink-0 items-center gap-2"
        >
          <span className="text-xl font-extrabold tracking-[-0.055em] text-[#11130f] transition-colors duration-300 group-hover:text-[#3f6728]">
            BAKI
          </span>

          <span className="font-mono text-sm font-bold text-[#4b702f] transition-transform duration-300 group-hover:translate-x-0.5">
            &lt;/&gt;
          </span>
        </a>

        <div className="hidden items-center gap-7 xl:flex">
          {navigationLinks.map((link) => {
            const isActive = activeSection === link.id;

            return (
              <a
                key={link.id}
                href={link.href}
                onClick={() =>
                  handleNavigation(link.id)
                }
                className={`group relative flex h-[68px] items-center px-1 text-sm font-semibold transition-colors duration-300 ${
                  isActive
                    ? "text-[#3e6727]"
                    : "text-black/55 hover:text-[#3e6727]"
                }`}
              >
                {link.label}

                <span
                  className={`absolute bottom-[13px] left-0 h-[2px] w-full origin-center rounded-full bg-[#4b702f] transition-transform duration-300 ease-out ${
                    isActive
                      ? "scale-x-100"
                      : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />

                {isActive && (
                  <span className="absolute bottom-[12px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#6e9c50] opacity-60 blur-[2px]" />
                )}
              </a>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3 xl:ml-0">
          <LanguageToggle />

          <a
            href="#contact"
            onClick={() =>
              handleNavigation("contact")
            }
            className="group hidden h-12 items-center gap-3 overflow-hidden rounded-2xl bg-[#315d20] px-5 text-sm font-semibold text-white shadow-[0_14px_35px_rgba(49,93,32,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#284e1a] hover:shadow-[0_18px_42px_rgba(49,93,32,0.30)] xl:inline-flex"
          >
            <span>{copy.nav.letsTalk}</span>

            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-all duration-300 group-hover:translate-x-1 group-hover:bg-white/20">
              →
            </span>
          </a>

          <button
            type="button"
            aria-label={
              menuOpen
                ? copy.nav.closeMenu
                : copy.nav.openMenu
            }
            aria-expanded={menuOpen}
            onClick={() =>
              setMenuOpen((current) => !current)
            }
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-[#171914] shadow-sm transition-all duration-300 xl:hidden ${
              menuOpen
                ? "border-[#4b702f]/30 bg-[#edf4e8] text-[#3e6727]"
                : "border-black/10 bg-white hover:border-[#4b702f]/25 hover:bg-[#f1f5ee]"
            }`}
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>
      </nav>

      <div
        className={`absolute inset-x-0 top-full overflow-hidden border-b border-black/[0.07] bg-[#f8f8f4]/98 shadow-[0_25px_50px_rgba(24,35,18,0.12)] backdrop-blur-2xl transition-all duration-500 xl:hidden ${
          menuOpen
            ? "pointer-events-auto max-h-[650px] translate-y-0 opacity-100"
            : "pointer-events-none max-h-0 -translate-y-3 opacity-0"
        }`}
      >
        <div className="mx-auto flex max-w-[1500px] flex-col px-4 py-4 sm:px-8">
          {navigationLinks.map((link, index) => {
            const isActive =
              activeSection === link.id;

            return (
              <a
                key={link.id}
                href={link.href}
                onClick={() =>
                  handleNavigation(link.id)
                }
                style={{
                  transitionDelay: menuOpen
                    ? `${index * 35}ms`
                    : "0ms",
                }}
                className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-semibold transition-all duration-300 ${
                  isActive
                    ? "bg-[#edf4e8] text-[#3e6727]"
                    : "text-black/65 hover:bg-black/[0.035] hover:text-[#3e6727]"
                }`}
              >
                <span>{link.label}</span>

                <span
                  className={`text-lg transition-transform duration-300 ${
                    isActive
                      ? "translate-x-0 opacity-100"
                      : "-translate-x-2 opacity-0"
                  }`}
                >
                  →
                </span>
              </a>
            );
          })}

          <a
            href="#contact"
            onClick={() =>
              handleNavigation("contact")
            }
            className="mt-4 flex h-12 items-center justify-center gap-3 rounded-xl bg-[#315d20] font-semibold text-white shadow-[0_14px_30px_rgba(49,93,32,0.20)]"
          >
            {copy.nav.letsTalk}
            <span>→</span>
          </a>
        </div>
      </div>
    </header>
  );
}