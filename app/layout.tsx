import type { Metadata } from "next";
import { Geist } from "next/font/google";

import ExperienceShell from "@/components/layout/experience-shell";
import LanguageProvider from "@/components/providers/language-provider";
import LoadingProvider from "@/components/providers/loading-provider";

import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "Baki | Full-Stack Developer",
  description:
    "Baki is a full-stack developer building modern, scalable and thoughtful digital products.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body className={`${geist.variable} antialiased`}>
        <LanguageProvider>
          <LoadingProvider>
            <ExperienceShell>
              {children}
            </ExperienceShell>
          </LoadingProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}