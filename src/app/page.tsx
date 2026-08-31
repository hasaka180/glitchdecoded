import GlitchNav from "@/components/GlitchNav";
import EditorsNote from "@/components/EditorsNote";
import Hero from "@/components/Hero";

export default function Home() {
  return (
    <>
      <GlitchNav />
      <main className="flex-1">
        <Hero />

        <EditorsNote />
      </main>
    </>
  );
}
