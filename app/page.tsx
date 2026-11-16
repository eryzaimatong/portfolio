import { Hero } from "@/components/Hero";
import { ProjectWall } from "@/components/ProjectWall";
import { About } from "@/components/About";
import { SkillGraph } from "@/components/SkillGraph";
import { Contact } from "@/components/Contact";

export default function Home() {
  return (
    <main id="main">
      <Hero />
      <ProjectWall />
      <About />
      <SkillGraph />
      <Contact />
    </main>
  );
}
