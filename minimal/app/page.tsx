import { Sidebar } from "@/components/Sidebar";
import { Hero } from "@/components/Hero";
import { HoloCarousel } from "@/components/HoloCarousel";
import { About, Skills, Experience, Leadership, Contact } from "@/components/Sections";
import { Motion } from "@/components/Motion";
import { FitReport } from "@/components/FitReport";
import { RoleProvider } from "@/components/RoleContext";

export default function Page() {
  return (
    <RoleProvider>
      <Sidebar />
      <main id="main" className="main">
        <Hero />
        <FitReport />
        <About />
        <HoloCarousel />
        <Skills />
        <Experience />
        <Leadership />
        <Contact />
      </main>
      <Motion />
    </RoleProvider>
  );
}
