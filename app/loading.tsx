export default function Loading() {
  return (
    <main className="flex min-h-[55vh] w-full items-center justify-center bg-[#f8f8f4]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-black/[0.08] border-t-[#426c2b]" />

        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-black/30">
          Loading...
        </span>
      </div>
    </main>
  );
}