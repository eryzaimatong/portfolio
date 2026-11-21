import { about, experience, leadership, credentials, ciscoOrg, contact, profile } from "@/data/profile";
import { skillGroups, skillNote } from "@/data/skills";
import logos from "@/data/logos.json";
import { CertButton } from "./Dialogs";
import { LeadershipMap } from "./LeadershipMap";
import { evAttrs, skillRoles } from "@/data/roles";
import { evidenceFor } from "@/data/evidence";

type Logo = { path: string; hex: string; title: string };
type Badge = { src: string; alt: string; round?: boolean; wide?: boolean };

/* A small monochrome stamp: the real logo, greyed on a light tile, coming back to colour on hover. */
function Stamp({ b }: { b?: Badge }) {
  if (!b) return null;
  return <span className={"stamp" + (b.wide ? " wide" : "") + (b.round ? " round" : "")}><img src={b.src} alt={b.alt} loading="lazy" /></span>;
}
const LOGOS = logos as Record<string, Logo>;

/* Numbered section heading with a hairline that bleeds in (and one slow drop) when it scrolls into view. */
function Sec({ n, label, id, link }: { n: string; label: string; id: string; link?: { href: string; text: string } }) {
  return (
    <header className="sec rv">
      <h2 id={id} className="pixel"><span className="n">{n}</span> — {label}</h2>
      {link && <a className="sec-link mono" href={link.href} target="_blank" rel="noopener">{link.text} →</a>}
      <i className="bleed" aria-hidden="true" />
    </header>
  );
}

export function About() {
  return (
    <section id="about" className="section" aria-labelledby="about-h">
      <Sec n="01" label="about" id="about-h" />
      <h3 className="about-lead rv">{about.heading}</h3>
      <p className="about-sub rv">{about.lead}</p>
      {about.bio.map((b) => <p key={b} className="about-bio rv">{b}</p>)}
      <dl className="facts rv">
        {about.fields.map(([k, v]) => (<div key={k}><dt className="mono">{k}</dt><dd>{v}</dd></div>))}
      </dl>
    </section>
  );
}

export function Skills() {
  return (
    <section id="skills" className="section" aria-labelledby="skills-h">
      <Sec n="03" label="skills" id="skills-h" />
      <p className="about-sub rv">What I work with across data and software, plus the tools I use to build and collaborate.</p>
      {skillGroups.map((g) => (
        <div key={g.id} className="sk-group rv">
          <h3 className="mono">{g.name}</h3>
          <ul className="chips">
            {g.skills.map((s) => {
              const l = LOGOS[s.name];
              return (
                <li key={s.name} className={s.used ? "used" : ""} data-skill={s.name} data-roles={skillRoles(s.name).join(" ")} data-projects={(s.projects ?? []).join(" ")} tabIndex={evidenceFor(s.name).length ? 0 : undefined}>
                  {l && <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d={l.path} fill="currentColor" /></svg>}
                  {s.name}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <p className="note rv"><i className="led" aria-hidden="true" /> {skillNote}</p>
    </section>
  );
}

export function Experience() {
  return (
    <section id="experience" className="section" aria-labelledby="exp-h">
      <Sec n="04" label="experience" id="exp-h" />
      <p className="about-sub rv">{experience.sub}</p>
      <ol className="rows">
        {experience.items.map((it) => (
          <li key={it.title} className="row rv" {...evAttrs(it.title)}>
            <p className="row-date mono">{it.date}</p>
            <div className="row-main">
              <Stamp b={it.badge} />
              <div>
                <h3>{it.titleHref ? <a href={it.titleHref} target="_blank" rel="noopener">{it.title}</a> : it.title}</h3>
                <p className="row-org">{it.org}</p>
                <p className="dim">{it.detail}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <h3 className="sub-h pixel rv">{credentials.heading}<span className="mono dim"> · {credentials.label}</span></h3>
      <ol className="rows">
        {credentials.items.map((c) => (
          <li key={c.title} className="row rv" {...evAttrs(c.title)}>
            <p className="row-date mono">{c.date}</p>
            <div className="row-main">
              <Stamp b={c.badge} />
              <div>
                <h3>{c.title}</h3>
                {c.cert && <CertButton src={c.cert.src} alt={c.cert.alt} title={c.title} />}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Leadership() {
  return (
    <section id="leadership" className="section" aria-labelledby="lead-h">
      <Sec n="05" label="leadership" id="lead-h" />
      <p className="about-sub rv">{leadership.sub}</p>
      <div className="rv"><LeadershipMap items={leadership.items as never} cisco={ciscoOrg as never} /></div>
    </section>
  );
}

export function Contact() {
  return (
    <section id="contact" className="section contact" aria-labelledby="contact-h">
      <Sec n="06" label="contact" id="contact-h" />
      <h3 className="contact-title pixel rv">{contact.heading}</h3>
      <p className="about-sub rv">{contact.lead}</p>
      <p className="contact-links mono rv">
        <a className="btn solid" href={`mailto:${profile.email}`}>{profile.email}</a>
        <a className="btn" href={profile.github} target="_blank" rel="noopener" aria-label="github, opens in a new tab">github ↗</a>
        <a className="btn" href={profile.linkedin} target="_blank" rel="noopener" aria-label="linkedin, opens in a new tab">linkedin ↗</a>
      </p>
      <footer className="foot mono rv"><span>{contact.footer}</span><a href="#home">back to top ↑</a></footer>
    </section>
  );
}
