"use client";

import {
  useEffect,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  getCurrentAdmin,
} from "@/lib/admin-api";

export default function AdminPage() {
  const router =
    useRouter();

  useEffect(
    () => {
      let cancelled =
        false;

      async function checkAuth() {
        const user =
          await getCurrentAdmin();

        if (cancelled) {
          return;
        }

        if (user) {
          router.replace(
            "/admin/dashboard",
          );

          return;
        }

        router.replace(
          "/admin/login",
        );
      }

      void checkAuth();

      return () => {
        cancelled = true;
      };
    },
    [router],
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f8f4]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-t-[#426c2b]" />

        <p className="text-[11px] font-medium text-black/40">
          Checking admin session...
        </p>
      </div>
    </main>
  );
}