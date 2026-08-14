"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AnimatePresence,
  m,
} from "motion/react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import ExperienceModeToggle from "@/components/layout/experience-mode-toggle";

import HeaderAccountMenu from "@/components/layout/header-account-menu";

import LanguageToggle from "@/components/layout/language-toggle";
import {
  PREMIUM_EASE,
} from "@/components/motion/motion-config";
import { useLanguage } from "@/components/providers/language-provider";
import {
  useLoading,
} from "@/components/providers/loading-provider";

const sectionIds = [
  "home",
  "about",
  "projects",
  "skills",
  "experience",
  "hire",
  "contact",
] as const;

type SectionId =
  (typeof sectionIds)[number];

const PENDING_SCROLL_KEY =
  "baki-portfolio-pending-scroll";

/*
 * Extra room between the sticky navbar
 * and the section we're scrolling to.
 */
const SCROLL_OFFSET = 88;

function MenuIcon({
  open,
}: {
  open: boolean;
}) {
  return (
    <span className="relative block h-5 w-6">
      <span
        className={`absolute left-0 top-[3px] h-[2px] w-6 rounded-full bg-current transition-all duration-300 ${
          open
            ? "translate-y-[7px] rotate-45"
            : ""
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
          open
            ? "-translate-y-[7px] -rotate-45"
            : ""
        }`}
      />
    </span>
  );
}

export default function Navbar() {
  const router =
    useRouter();

  const pathname =
    usePathname();

  const { copy } =
    useLanguage();

  const {
    hasRevealed,
  } = useLoading();

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  const [
    activeSection,
    setActiveSection,
  ] =
    useState<SectionId>("home");

  const [
    isScrolled,
    setIsScrolled,
  ] = useState(false);

  const scrollFrameRef =
    useRef<number | null>(
      null,
    );

  const isHomePage =
    pathname === "/";

  const navigationLinks: {
    label: string;
    id: SectionId;
  }[] = [
    {
      label:
        copy.nav.home,
      id: "home",
    },
    {
      label:
        copy.nav.about,
      id: "about",
    },
    {
      label:
        copy.nav.projects,
      id: "projects",
    },
    {
      label:
        copy.nav.skills,
      id: "skills",
    },
    {
      label:
        copy.nav.experience,
      id: "experience",
    },
    {
      label:
        copy.nav.contact,
      id: "contact",
    },
  ];

  /*
   * Scroll to any homepage section without
   * adding #section to the URL.
   */
  const scrollToSection =
    useCallback(
      (
        sectionId: SectionId,
        behavior:
          | ScrollBehavior
          | undefined = "smooth",
      ) => {
        const section =
          document.getElementById(
            sectionId,
          );

        if (!section) {
          return false;
        }

        /*
         * Home should always go to the true
         * top of the page.
         */
        if (
          sectionId === "home"
        ) {
          window.scrollTo({
            top: 0,
            behavior,
          });

          return true;
        }

        const sectionTop =
          section.getBoundingClientRect()
            .top +
          window.scrollY;

        /*
         * Keep the heading comfortably below
         * the sticky navbar.
         */
        const finalPosition =
          Math.max(
            0,
            sectionTop -
              SCROLL_OFFSET,
          );

        window.scrollTo({
          top: finalPosition,
          behavior,
        });

        return true;
      },
      [],
    );

  /*
   * Main navbar action.
   *
   * If already on homepage:
   * → scroll directly.
   *
   * If on another route:
   * → remember destination
   * → navigate to /
   * → scroll after homepage mounts.
   */
  const handleNavigation =
    useCallback(
      (
        sectionId: SectionId,
      ) => {
        setMenuOpen(false);

        if (isHomePage) {
          setActiveSection(
            sectionId,
          );

          /*
           * Give the mobile menu one frame
           * to begin closing before scrolling.
           */
          window.requestAnimationFrame(
            () => {
              scrollToSection(
                sectionId,
              );
            },
          );

          return;
        }

        /*
         * Store this temporarily so the homepage
         * knows where to scroll after navigation.
         *
         * This keeps the URL clean:
         *
         * /
         *
         * instead of:
         *
         * /#projects
         */
        window.sessionStorage.setItem(
          PENDING_SCROLL_KEY,
          sectionId,
        );

        router.push("/");
      },
      [
        isHomePage,
        router,
        scrollToSection,
      ],
    );

  /*
   * Detect navbar scroll state.
   */
  useEffect(() => {
    function handleScroll() {
      setIsScrolled(
        window.scrollY > 20,
      );
    }

    handleScroll();

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      },
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll,
      );
    };
  }, []);

  /*
   * When arriving back on the homepage from:
   *
   * /projects
   * /projects/gym-house-website
   * /projects/maya-burger-website
   *
   * check whether a navbar destination was saved.
   */
  useEffect(() => {
    if (!isHomePage) {
      return;
    }

    const pendingSection =
      window.sessionStorage.getItem(
        PENDING_SCROLL_KEY,
      );

    if (
      !pendingSection ||
      !sectionIds.includes(
        pendingSection as SectionId,
      )
    ) {
      return;
    }

    const sectionId =
      pendingSection as SectionId;

    window.sessionStorage.removeItem(
      PENDING_SCROLL_KEY,
    );

    /*
     * The homepage content may take a few frames
     * to mount after route navigation.
     *
     * Retry briefly until the destination exists.
     */
    let attempts = 0;

    const maxAttempts = 60;

    function tryScroll() {
      attempts += 1;

      const section =
        document.getElementById(
          sectionId,
        );

      if (section) {
        setActiveSection(
          sectionId,
        );

        scrollToSection(
          sectionId,
          "smooth",
        );

        return;
      }

      if (
        attempts >= maxAttempts
      ) {
        return;
      }

      scrollFrameRef.current =
        window.requestAnimationFrame(
          tryScroll,
        );
    }

    scrollFrameRef.current =
      window.requestAnimationFrame(
        tryScroll,
      );

    return () => {
      if (
        scrollFrameRef.current !==
        null
      ) {
        window.cancelAnimationFrame(
          scrollFrameRef.current,
        );
      }
    };
  }, [
    isHomePage,
    scrollToSection,
  ]);

  /*
   * Detect which homepage section
   * is currently visible.
   *
   * This keeps the active navbar underline
   * synchronized with the user's scroll.
   */
  useEffect(() => {
    if (!isHomePage) {
      return;
    }

    const sections =
      sectionIds
        .map((sectionId) =>
          document.getElementById(
            sectionId,
          ),
        )
        .filter(
          (
            section,
          ): section is HTMLElement =>
            Boolean(section),
        );

    if (
      sections.length === 0
    ) {
      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          const visibleSections =
            entries
              .filter(
                (entry) =>
                  entry.isIntersecting,
              )
              .sort(
                (
                  first,
                  second,
                ) =>
                  second.intersectionRatio -
                  first.intersectionRatio,
              );

          const mostVisible =
            visibleSections[0];

          if (!mostVisible) {
            return;
          }

          const sectionId =
            mostVisible.target
              .id as SectionId;

          if (
            sectionIds.includes(
              sectionId,
            )
          ) {
            setActiveSection(
              sectionId,
            );
          }
        },
        {
          /*
           * Makes the active state feel natural
           * instead of switching the instant a
           * section touches the viewport.
           */
          rootMargin:
            "-22% 0px -58% 0px",

          threshold: [
            0.01,
            0.1,
            0.25,
            0.5,
          ],
        },
      );

    sections.forEach(
      (section) => {
        observer.observe(
          section,
        );
      },
    );

    return () => {
      observer.disconnect();
    };
  }, [isHomePage]);

  /*
   * ESC closes mobile menu.
   */
  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key === "Escape"
      ) {
        setMenuOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [menuOpen]);

  return (
    <m.header
      initial={{
        opacity: 0,
        y: -10,
      }}
      animate={
        hasRevealed
          ? {
              opacity: 1,
              y: 0,
            }
          : undefined
      }
      transition={{
        duration: 0.42,
        ease: PREMIUM_EASE,
      }}
      className={`sticky top-0 z-[100] border-b transition-all duration-500 ${
        isScrolled
          ? "border-black/[0.07] bg-[#f8f8f4]/90 shadow-[0_12px_40px_rgba(28,42,20,0.07)] backdrop-blur-2xl"
          : "border-black/[0.04] bg-[#f8f8f4]/75 backdrop-blur-xl"
      }`}
    >
      <nav
  className={`mx-auto flex w-full max-w-[1500px] items-center justify-between overflow-visible px-2 transition-all duration-500 sm:px-6 lg:px-8 xl:px-12 ${
          isScrolled
            ? "h-[68px]"
            : "h-[82px]"
        }`}
      >
        {/* ==========================================
            LOGO / HOME BUTTON
           ========================================== */}

        <button
          type="button"
          onClick={() => {
            handleNavigation(
              "home",
            );
          }}
          aria-label={
            copy.nav.home
          }
          className="group flex shrink-0 cursor-pointer items-center gap-2"
        >
          <span
            className={`
              text-lg
              font-extrabold

              tracking-[-0.055em]

              text-[#11130f]

              transition-colors
              duration-300

              group-hover:text-[#3f6728]

              sm:text-xl
            `}
          >
            BAKI
          </span>

          <span
            className={`
              hidden

              font-mono
              text-sm
              font-bold

              text-[#4b702f]

              sm:inline
            `}
          >
            &lt;/&gt;
          </span>
        </button>

        {/* ==========================================
            DESKTOP NAVIGATION
           ========================================== */}

        <div className="hidden items-center gap-6 xl:flex">
          {navigationLinks.map(
            (link) => {
              const active =
                isHomePage &&
                activeSection ===
                  link.id;

              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => {
                    handleNavigation(
                      link.id,
                    );
                  }}
                  className={`
                    group
                    relative

                    flex
                    h-[68px]

                    cursor-pointer

                    items-center

                    px-1

                    text-sm
                    font-semibold

                    transition-colors
                    duration-300

                    ${
                      active
                        ? "text-[#3e6727]"
                        : "text-black/55 hover:text-[#3e6727]"
                    }
                  `}
                >
                  {link.label}

                  <span
                    className={`
                      absolute
                      bottom-[13px]
                      left-0

                      h-[2px]
                      w-full

                      origin-center
                      rounded-full

                      bg-[#4b702f]

                      transition-transform
                      duration-300

                      ${
                        active
                          ? "scale-x-100"
                          : "scale-x-0 group-hover:scale-x-100"
                      }
                    `}
                  />
                </button>
              );
            },
          )}
        </div>

        {/* ==========================================
            RIGHT CONTROLS
           ========================================== */}

        <div
          className={`
            ml-auto

            flex
            min-w-0
            max-w-[calc(100%-58px)]
            shrink

            items-center
            justify-end

            gap-1

            sm:max-w-none
            sm:gap-2

            xl:ml-0
            xl:shrink-0
            xl:gap-3
          `}
        >
{/* ==========================================
    EXPERIENCE
   ========================================== */}

<ExperienceModeToggle />

{/* ==========================================
    LANGUAGE
   ========================================== */}

<LanguageToggle />

{/* ==========================================
    ACCOUNT

    Mobile:
    performance → language → account → hamburger

    Desktop:
    performance → language → account → CTA
   ========================================== */}

<HeaderAccountMenu />

{/* DESKTOP CONTACT BUTTON */}
<button
  type="button"
  onClick={() => {
    handleNavigation(
      "contact",
    );
  }}
            className={`
              group

              hidden
              h-12

              cursor-pointer

              items-center
              gap-3

              rounded-2xl

              bg-[#315d20]

              px-5

              text-sm
              font-semibold
              text-white

              shadow-[0_14px_35px_rgba(49,93,32,0.22)]

              transition-all
              duration-300

              hover:-translate-y-0.5
              hover:bg-[#284e1a]

              xl:inline-flex
            `}
          >
            <span>
              {
                copy.nav
                  .letsTalk
              }
            </span>

            <span
              className={`
                flex
                h-7
                w-7

                items-center
                justify-center

                rounded-full

                bg-white/15

                transition-transform
                duration-300

                group-hover:translate-x-1
              `}
            >
              →
            </span>
          </button>

          {/* MOBILE MENU BUTTON */}

          <button
            type="button"
            aria-label={
              menuOpen
                ? copy.nav
                    .closeMenu
                : copy.nav
                    .openMenu
            }
            aria-expanded={
              menuOpen
            }
            onClick={() => {
              setMenuOpen(
                (current) =>
                  !current,
              );
            }}
            className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border text-[#171914] shadow-sm transition-all duration-300 sm:h-11 sm:w-11 xl:hidden ${
              menuOpen
                ? "border-[#4b702f]/30 bg-[#edf4e8] text-[#3e6727]"
                : "border-black/10 bg-white hover:border-[#4b702f]/25"
            }`}
          >
            <MenuIcon
              open={
                menuOpen
              }
            />
          </button>
        </div>
      </nav>

      {/* ==========================================
          MOBILE NAVIGATION
         ========================================== */}

      <AnimatePresence
        initial={false}
      >
        {menuOpen && (
          <m.div
            className="absolute inset-x-0 top-full overflow-hidden border-b border-black/[0.07] bg-[#f8f8f4]/98 shadow-[0_25px_50px_rgba(24,35,18,0.12)] backdrop-blur-2xl xl:hidden"
            initial={{
              opacity: 0,
              y: -10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -8,
            }}
            transition={{
              duration: 0.26,
              ease: PREMIUM_EASE,
            }}
          >
            <div className="mx-auto flex max-w-[1500px] flex-col px-4 py-4 sm:px-8">
          {navigationLinks.map(
            (
              link,
              index,
            ) => {
              const active =
                isHomePage &&
                activeSection ===
                  link.id;

              return (
                <m.button
                  key={link.id}
                  type="button"
                  onClick={() => {
                    handleNavigation(
                      link.id,
                    );
                  }}
                  initial={{
                    opacity: 0,
                    x: -7,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: -4,
                  }}
                  transition={{
                    delay:
                      index * 0.025,
                    duration: 0.24,
                    ease: PREMIUM_EASE,
                  }}
                  className={`group flex w-full cursor-pointer items-center justify-between rounded-xl px-4 py-3.5 text-left text-base font-semibold transition-all duration-300 ${
                    active
                      ? "bg-[#edf4e8] text-[#3e6727]"
                      : "text-black/65 hover:bg-black/[0.035] hover:text-[#3e6727]"
                  }`}
                >
                  <span>
                    {
                      link.label
                    }
                  </span>

                  <span
                    className={`
                      transition-transform
                      duration-300

                      group-hover:translate-x-1
                    `}
                  >
                    →
                  </span>
                </m.button>
              );
            },
          )}

          {/* MOBILE CONTACT */}

{/* MOBILE GET HIRED */}
<m.button
  type="button"
  onClick={() => {
    handleNavigation(
      "hire",
    );
  }}
  initial={{
    opacity: 0,
    y: 6,
  }}
  animate={{
    opacity: 1,
    y: 0,
  }}
  exit={{
    opacity: 0,
    y: 4,
  }}
  transition={{
    delay:
      navigationLinks.length *
      0.025,
    duration: 0.24,
    ease: PREMIUM_EASE,
  }}
            className={`
              group

              mt-4

              flex
              h-12
              w-full

              cursor-pointer

              items-center
              justify-center
              gap-3

              rounded-xl

              bg-[#315d20]

              font-semibold
              text-white

              shadow-[0_12px_30px_rgba(49,93,32,0.16)]

              transition-all
              duration-300

              active:scale-[0.98]
            `}
          >
            <span>
              {
                copy.nav
                  .letsTalk
              }
            </span>

            <span
              className={`
                transition-transform
                duration-300

                group-hover:translate-x-1
              `}
            >
              →
            </span>
          </m.button>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.header>
  );
}
