import type { Metadata } from "next";
import Link from "next/link";
import { skillNote } from "@/data/skills";
import { SkillGroups } from "@/components/SkillList";
import { Mark } from "@/components/Mark";

export const metadata: Metadata = {
  title: "Skills | Eryza Mae Imatong",
  description: "What I work with across data and software, plus the tools I use to build and collaborate.",
  alternates: { canonical: "/skills" },
};

/* The full skills list on its own page (linked from "View all skills" in the corridor). */
export default function SkillsPage() {
  return (
    <main className="skills-page">
      <Link className="sp-back mono" href="/#skills"><Mark size={22} /> back to the portfolio</Link>
      <header className="sp-head">
        <p className="mono sp-k"><span>03</span> — skills</p>
        <h1 className="pixel sp-title">All skills</h1>
        <p className="about-sub">What I work with across data and software, plus the tools I use to build and collaborate.</p>
      </header>
      <SkillGroups headingLevel={2} />
      <p className="note"><i className="led" aria-hidden="true" /> {skillNote}</p>
    </main>
  );
}
