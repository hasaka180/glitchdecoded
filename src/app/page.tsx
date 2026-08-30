import GlitchNav from "@/components/GlitchNav";
import Hero from "@/components/Hero";

export default function Home() {
  return (
    <>
      <GlitchNav />
      <main className="flex-1">
        <Hero />

        {/* Placeholder for whatever comes next — keeps the fixed nav honest. */}
        <section
          id="work"
          className="mx-auto max-w-[1400px] px-5 py-28 sm:px-8"
        >
          <h2 className="font-mono text-[11px] tracking-[0.32em] text-white/80 uppercase">
            Next section
          </h2>
          <p className="mt-4 max-w-[52ch] text-2xl leading-tight font-semibold text-white sm:text-3xl">
            The hero is done. Scroll behaviour, work grid and the rest of the
            page slot in below this line.
          </p>
        </section>
      </main>
    </>
  );
}
