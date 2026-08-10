import type {
  Metadata,
} from "next";
import BakiAiGlobal from "@/components/ai/baki-ai-global";
import {
  Geist,
} from "next/font/google";

import {
  Analytics,
} from "@vercel/analytics/next";

import {
  SpeedInsights,
} from "@vercel/speed-insights/next";

import ExperienceShell from "@/components/layout/experience-shell";

import ExperienceModeProvider from "@/components/providers/experience-mode-provider";

import LanguageProvider from "@/components/providers/language-provider";

import LoadingProvider from "@/components/providers/loading-provider";

import WebVitalsReporter from "@/components/performance/web-vitals-reporter";

import "./globals.css";

/* =========================================================
   FONT
   ========================================================= */

const geist =
  Geist({
    subsets: [
      "latin",
    ],

    variable:
      "--font-geist",
  });

/* =========================================================
   METADATA
   ========================================================= */

export const metadata:
  Metadata = {
    title:
      "Baki | Full-Stack Developer",

    description:
      "Baki is a full-stack developer building modern, scalable and thoughtful digital products.",
  };

/* =========================================================
   ROOT
   ========================================================= */

export default function RootLayout({
  children,
}: Readonly<{
  children:
    React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body
        className={`${geist.variable} antialiased`}
      >
        <LanguageProvider>
          <ExperienceModeProvider>
            <LoadingProvider>
              <ExperienceShell>
                {
                  children
                }
              </ExperienceShell>
              <BakiAiGlobal />
            </LoadingProvider>
          </ExperienceModeProvider>
          
        </LanguageProvider>

        {/* VERCEL WEB ANALYTICS */}

        <Analytics />

        {/* VERCEL SPEED INSIGHTS */}

        <SpeedInsights />

        {/* OUR CUSTOM PERFORMANCE DATABASE */}

        <WebVitalsReporter />
        
      </body>
    </html>
  );
}