import type { Metadata } from "next";

import HireInfo from "@/components/hire/hire-info";
import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";

export const metadata: Metadata = {
  title:
    "Sales Representative Opportunity | Baki",

  description:
    "Learn how the Baki commission-based website sales representative opportunity works, including commissions, sales methods, training and onboarding.",
};

export default function HireInfoPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f8f8f4]">
        <HireInfo />
      </main>

      <Footer />
    </>
  );
}