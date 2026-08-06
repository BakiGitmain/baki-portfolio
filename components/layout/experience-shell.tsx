"use client";

import { useEffect, type ReactNode } from "react";

import SiteLoader from "@/components/layout/site-loader";
import { useLoading } from "@/components/providers/loading-provider";

export default function ExperienceShell({
  children,
}: {
  children: ReactNode;
}) {
  const { hasRevealed } = useLoading();

  useEffect(() => {
    document.documentElement.classList.toggle(
      "is-experience-loading",
      !hasRevealed,
    );

    return () => {
      document.documentElement.classList.remove(
        "is-experience-loading",
      );
    };
  }, [hasRevealed]);

  return (
    <>
      <SiteLoader />

      <div
        className={`experience-shell ${
          hasRevealed ? "experience-shell--ready" : ""
        }`}
        aria-hidden={!hasRevealed}
        inert={!hasRevealed}
      >
        {children}
      </div>
    </>
  );
}