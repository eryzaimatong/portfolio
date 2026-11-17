import { profile } from "@/data/profile";

/* Key phrases are marked the way an editor would: a blood-red line that draws itself under the words. */
const Hl = ({ i, children }: { i: number; children: React.ReactNode }) => <mark className="hl" style={{ "--i": i } as React.CSSProperties}>{children}</mark>;

export function Hero() {
  return (
    <section id="home" className="hero" aria-label="Home">
      <div className="hero-copy">
        <h1 className="hero-name pixel">{profile.name}<i className="caret" aria-hidden="true" /></h1>
        <p className="mono hero-kicker">{profile.kicker}</p>
        <p className="hero-intro">
          <Hl i={0}>BSIT student</Hl> at <Hl i={1}>PUP Manila</Hl>, specializing in <Hl i={2}>Data Science</Hl>.
          {" "}Looking for <Hl i={3}>data science, analytics and technical internships</Hl>. Based in <em className="serif">Manila, Philippines.</em>
        </p>
        <p className="hero-links mono">
          <a href={profile.github} target="_blank" rel="noopener" aria-label="github, opens in a new tab">github ↗</a>
          <a href={profile.linkedin} target="_blank" rel="noopener" aria-label="linkedin, opens in a new tab">linkedin ↗</a>
          <a href={`mailto:${profile.email}`} aria-label="email, opens your mail app">email ↗</a>
        </p>
      </div>
      <figure className="hero-photo">
        <div className="ph">
          <img
            src="/assets/hero-960.webp" width={960} height={1200}
            srcSet="/assets/hero-640.webp 640w, /assets/hero-960.webp 960w, /assets/hero-1280.webp 1280w" sizes="(max-width: 900px) 80vw, 340px"
            alt="Eryza Mae Imatong looking back over her shoulder beside a concrete wall of valves. The picture is black and white; only the red valve wheels and her lips keep their colour."
            fetchPriority="high" decoding="async" />
          {/* a red grease-pencil loop, drawn once around the subject like a marked frame on a contact sheet */}
          <svg className="ph-ring" viewBox="0 0 100 125" aria-hidden="true">
            <path pathLength="100" d="M69 33.5 C78 33 82 41 80 49 C78 58 70 61 64 58 C57 55 56 44 60 38 C62 35 66 33 71 33.8" />
          </svg>
        </div>
        <figcaption className="mono"><span className="fr">FR 07 ▸</span><span>{profile.name}</span></figcaption>
      </figure>
    </section>
  );
}
