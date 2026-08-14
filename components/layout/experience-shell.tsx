"use client";

import {
  useEffect,
  type ReactNode,
} from "react";

import {
  usePathname,
} from "next/navigation";

import SiteLoader from "@/components/layout/site-loader";

import {
  useLoading,
} from "@/components/providers/loading-provider";

export default function ExperienceShell({
  children,
}: {
  children:
    ReactNode;
}) {
  const pathname =
    usePathname();

  const {
    hasRevealed,
  } = useLoading();

  const isAdminRoute =
    pathname ===
      "/admin" ||
    pathname.startsWith(
      "/admin/",
    );

  const bypassesExperienceLoader =
    isAdminRoute ||
    pathname ===
      "/cv";

  useEffect(() => {
    if (
      bypassesExperienceLoader
    ) {
      document.documentElement.classList.remove(
        "is-experience-loading",
      );

      return;
    }

    document.documentElement.classList.toggle(
      "is-experience-loading",
      !hasRevealed,
    );

    return () => {
      document.documentElement.classList.remove(
        "is-experience-loading",
      );
    };
  }, [
    hasRevealed,
    bypassesExperienceLoader,
  ]);

  if (
    bypassesExperienceLoader
  ) {
    return (
      <>
        {
          children
        }
      </>
    );
  }

  return (
    <>
      <SiteLoader />

      <div
        className={`experience-shell ${
          hasRevealed
            ? "experience-shell--ready"
            : ""
        }`}
        aria-hidden={
          !hasRevealed
        }
        inert={
          !hasRevealed
        }
      >
        {
          children
        }
      </div>
    </>
  );
}
