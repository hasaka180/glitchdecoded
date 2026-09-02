import GlitchNav from "@/components/GlitchNav";
import Hero from "@/components/Hero";
import RipStage from "@/components/RipStage";
import TopicField from "@/components/TopicField";

export default function Home() {
  return (
    <>
      <GlitchNav />
      <main className="flex-1">
        <Hero />

        <RipStage />

        <TopicField />
      </main>
    </>
  );
}
