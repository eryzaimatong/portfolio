import { profile } from "@/data/profile";
import { ROLES, type Seg } from "@/data/roles";
import { PhotoScan } from "./PhotoScan";
import { RoleChips } from "./RoleChips";
import { Greeting } from "./Greeting";

/* Key phrases are marked the way an editor would: a blood-red line that draws itself under the words. */
const Hl = ({ i, children }: { i: number; children: React.ReactNode }) => <mark className="hl" style={{ "--i": i } as React.CSSProperties}>{children}</mark>;
const Line = ({ segs }: { segs: Seg[] }) => {
  let i = 0;
  return <>{segs.map((s, k) => (typeof s === "string" ? s : <Hl key={k} i={i++}>{s.hl}</Hl>))}</>;
};

export function Hero() {
  return (
    <section id="home" className="hero" aria-label="Home">
      <div className="hero-copy">
        <RoleChips />
        <Greeting />
        <h1 className="hero-name pixel">{profile.name}<i className="caret" aria-hidden="true" /></h1>
        <p className="mono hero-kicker">{profile.kicker}</p>
        {/* every version of the line sits in the same grid cell, so the box is always as tall as the longest and nothing shifts */}
        <div className="rl hero-line" style={{ viewTransitionName: "hero-line" }}>
          <p data-for="all" className="hero-intro">
            <Hl i={0}>BSIT student</Hl> at <Hl i={1}>PUP Manila</Hl>, specializing in <Hl i={2}>Data Science</Hl>.
            {" "}Looking for <Hl i={3}>data science, analytics and technical internships</Hl>. Based in <em className="serif">Manila, Philippines.</em>
          </p>
          {ROLES.map((r) => (<p key={r.id} data-for={r.id} className="hero-intro"><Line segs={r.hero} /></p>))}
        </div>
        <p className="hero-links mono">
          <a href={profile.github} target="_blank" rel="noopener" aria-label="github, opens in a new tab">github ↗</a>
          <a href={profile.linkedin} target="_blank" rel="noopener" aria-label="linkedin, opens in a new tab">linkedin ↗</a>
          <a href={`mailto:${profile.email}`} aria-label="email, opens your mail app">email ↗</a>
        </p>
      </div>
      <figure className="hero-photo">
        <PhotoScan>
          <img
            src="/assets/hero-960.webp" width={960} height={1200}
            srcSet="/assets/hero-640.webp 640w, /assets/hero-960.webp 960w, /assets/hero-1280.webp 1280w" sizes="(max-width: 900px) 80vw, 340px"
            alt="Eryza Mae Imatong looking back over her shoulder beside a concrete wall of red valves. The photo starts in black and white and turns to full colour."
            fetchPriority="high" decoding="async" />
        </PhotoScan>
        <figcaption className="mono"><span>{profile.name}</span></figcaption>
      </figure>
    </section>
  );
}
