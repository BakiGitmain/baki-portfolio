import type { Metadata } from "next";

import HireApplication from "@/components/hire/hire-application";

import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";

export const metadata: Metadata = {
  title: "Sales Representative Application | Baki",

  description:
    "Apply to work with Baki as a commission-based website sales representative.",
};

export default function HirePage() {
  return (
    <>
      <Navbar />

      <main className="hire-page-main">
        <HireApplication />
      </main>

      <Footer />
    </>
  );
}