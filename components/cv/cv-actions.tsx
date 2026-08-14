"use client";

import {
  Download,
  Printer,
} from "lucide-react";

import {
  CV_DOWNLOAD_PATH,
  cvData,
} from "@/lib/cv-data";

export default function CvActions({
  className,
}: {
  className?:
    string;
}) {
  return (
    <div
      className={
        className
      }
    >
      <a
        href={
          CV_DOWNLOAD_PATH
        }
        download={
          cvData.downloadFileName
        }
        aria-label={`Download ${cvData.identity.fullName}'s CV as a PDF`}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#315a1f] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(49,90,31,0.2)] transition hover:-translate-y-0.5 hover:bg-[#294c1b]"
      >
        <Download
          className="h-4 w-4"
          aria-hidden="true"
        />

        Download PDF
      </a>

      <button
        type="button"
        onClick={() =>
          window.print()
        }
        aria-label={`Print ${cvData.identity.fullName}'s CV`}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#1b2118] transition hover:-translate-y-0.5 hover:border-[#426c2b]/30 hover:text-[#315a1f]"
      >
        <Printer
          className="h-4 w-4"
          aria-hidden="true"
        />

        Print
      </button>
    </div>
  );
}
