import { Sidebar } from "@/components/Sidebar";
import { Hero } from "@/components/Hero";
import { Projects } from "@/components/Projects";
import { About, Skills, Experience, Leadership, Contact } from "@/components/Sections";
import { Motion } from "@/components/Motion";
import { Intro } from "@/components/Intro";
import { Tape } from "@/components/Tape";

export default function Page() {
  return (
    <>
      <Sidebar />
      <main id="main" className="main">
        <Hero />
        <Tape />
        <About />
        <Projects />
        <Skills />
        <Experience />
        <Leadership />
        <Contact />
      </main>
      <Motion />
      <Intro />
    </>
  );
}
