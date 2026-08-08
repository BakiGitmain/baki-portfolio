"use client";

import {
  useLanguage,
} from "@/components/providers/language-provider";

type AdminPlaceholderProps = {
  titleEn: string;
  titleAm: string;

  descriptionEn: string;
  descriptionAm: string;
};

export default function AdminPlaceholder({
  titleEn,
  titleAm,
  descriptionEn,
  descriptionAm,
}: AdminPlaceholderProps) {
  const {
    language,
  } = useLanguage();

  return (
    <section className="flex min-h-[520px] items-center justify-center rounded-[24px] border border-black/[0.06] bg-white shadow-[0_10px_35px_rgba(37,50,29,0.035)]">
      <div className="max-w-[440px] px-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf5e7] text-[18px] font-black text-[#426c2b]">
          &lt;/&gt;
        </span>

        <h2 className="mt-5 text-[24px] font-extrabold tracking-[-0.045em] text-[#1b2018]">
          {language === "am"
            ? titleAm
            : titleEn}
        </h2>

        <p className="mx-auto mt-3 max-w-[380px] text-[10.5px] leading-6 text-black/40">
          {language === "am"
            ? descriptionAm
            : descriptionEn}
        </p>

        <div className="mx-auto mt-6 inline-flex rounded-full bg-[#f3f7ef] px-4 py-2 text-[8px] font-bold tracking-[0.12em] text-[#688f4b]">
          BUILDING NEXT
        </div>
      </div>
    </section>
  );
}