"use client";

import { usePathname } from "next/navigation";

import BakiAiChat from "@/components/ai/baki-ai-chat";

export default function BakiAiGlobal() {
  const pathname = usePathname();

  /* =========================================================
     DO NOT SHOW BAKI AI INSIDE ADMIN
     ========================================================= */

  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  ) {
    return null;
  }

  return <BakiAiChat />;
}