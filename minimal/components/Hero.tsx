import { profile } from "@/data/profile";
import { PhotoScan } from "./PhotoScan";

/* Key phrases are marked the way an editor would: a blood-red line that draws itself under the words. */
const Hl = ({ i, children }: { i: number; children: React.ReactNode }) => <mark className="hl" style={{ "--i": i } as React.CSSProperties}>{children}</mark>;

export function Hero() {
  return (
    <section id="hello" className="hero" aria-label="Introduction">
      <div className="hero-copy">
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
