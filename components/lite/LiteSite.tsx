import { profile, about, experience, leadership, credentials, ciscoOrg, contact } from "@/data/profile";
import { projects } from "@/data/projects";
import { skillGroups, skillNote } from "@/data/skills";
import { ROOM_NAMES } from "@/lib/rooms";

/* The whole museum as a calm, ordinary scrolling page: same words, same order, same names. Server-rendered, so it is also the SEO and no-JS content. */
export function LiteSite() {
  const n = (name: string) => String(ROOM_NAMES.indexOf(name as never) + 1).padStart(2, "0");
  return (
    <div className="lite">
      <section id="home" className="ls" aria-labelledby="l-home">
        <p className="mono ls-no">{n("Home")} / 07 · Home</p>
        <p className="mono kicker">{profile.kicker}</p>
        <h1 id="l-home" className="ls-name">{profile.name}</h1>
        <p className="ls-lead">{profile.intro}</p>
        <p className="ls-links"><a href={`mailto:${profile.email}`}>Email</a><a href={profile.github} target="_blank" rel="noopener">GitHub</a><a href={profile.linkedin} target="_blank" rel="noopener">LinkedIn</a></p>
      </section>

      <section id="about" className="ls" aria-labelledby="l-about">
        <p className="mono ls-no">{n("About")} / 07 · About</p>
        <h2 id="l-about" className="ls-h">{about.heading}</h2>
        <figure className="ls-photo"><img src={about.photo.src} alt={about.photo.alt} width={360} height={360} /></figure>
        <p className="ls-lead">{about.lead}</p>
        {about.bio.map((b) => <p key={b}>{b}</p>)}
        <dl className="ls-fields">{about.fields.map(([k, v]) => (<div key={k}><dt className="mono">{k}</dt><dd>{v}</dd></div>))}</dl>
      </section>

      <section id="projects" className="ls" aria-labelledby="l-proj">
        <p className="mono ls-no">{n("Projects")} / 07 · Projects</p>
        <h2 id="l-proj" className="ls-h">Selected Work</h2>
        <p className="ls-sub">Two public projects, each built around a real problem.</p>
        {projects.map((p, i) => (
          <article key={p.slug} className="ls-proj">
            <p className="mono">{String(i + 1).padStart(2, "0")} · {p.eyebrow}</p>
            <h3>{p.title}</h3>
            <img className="ls-cover" src={p.cover} alt={p.gallery[0].caption} width={p.galleryRatio[0]} height={p.galleryRatio[1]} />
            <p className="ls-lead">{p.tagline}</p>
            <dl className="ls-fields"><div><dt className="mono">Role</dt><dd>{p.role}</dd></div><div><dt className="mono">Timeline</dt><dd>{p.timeline}</dd></div><div><dt className="mono">Status</dt><dd>{p.status}</dd></div></dl>
            {p.metrics && <ul className="ls-results">{p.metrics.map((m) => (<li key={m.label}><b>{m.value}</b><span>{m.label}</span></li>))}</ul>}
            <h4 className="mono">The problem</h4><p>{p.body.problem}</p>
            <h4 className="mono">What I built</h4><p>{p.body.approach}</p>
            <h4 className="mono">Technical decisions</h4><ul>{p.decisions.map((d) => <li key={d}>{d}</li>)}</ul>
            <h4 className="mono">Status and limits</h4><p>{p.body.outcome}</p>
            <h4 className="mono">Built with</h4><ul className="ls-chips">{p.stack.map((s) => <li key={s}>{s}</li>)}</ul>
            <div className="ls-gal">{p.gallery.map((g) => (<figure key={g.src}><img src={g.src} alt={g.caption} width={p.galleryRatio[0]} height={p.galleryRatio[1]} loading="lazy" /><figcaption>{g.caption}</figcaption></figure>))}</div>
            <p className="ls-note">{p.galleryNote}</p>
            {p.note && <p className="ls-note">{p.note}</p>}
            <p className="ls-links">{p.links?.github && <a href={p.links.github} target="_blank" rel="noopener">View on GitHub</a>}{p.links?.demo && <a href={p.links.demo} target="_blank" rel="noopener">Live demo</a>}</p>
          </article>
        ))}
      </section>

      <section id="skills" className="ls" aria-labelledby="l-skills">
        <p className="mono ls-no">{n("Skills")} / 07 · Skills</p>
        <h2 id="l-skills" className="ls-h">Tech Stack</h2>
        <p className="ls-sub">What I work with across data and software, plus the tools I use to build and collaborate.</p>
        {skillGroups.map((g) => (<div key={g.id} className="ls-group"><h3 className="mono">{g.name}</h3><ul className="ls-chips">{g.skills.map((s) => <li key={s.name} className={s.used ? "used" : ""}>{s.name}</li>)}</ul></div>))}
        <p className="ls-note">{skillNote}</p>
      </section>

      <section id="experience" className="ls" aria-labelledby="l-exp">
        <p className="mono ls-no">{n("Experience")} / 07 · Experience</p>
        <h2 id="l-exp" className="ls-h">{experience.heading}</h2>
        <p className="ls-sub">{experience.sub}</p>
        {experience.items.map((it) => (
          <article key={it.title} className="ls-item"><p className="mono">{it.date}</p><h3>{it.titleHref ? <a href={it.titleHref} target="_blank" rel="noopener">{it.title}</a> : it.title}</h3><p className="org">{it.org}</p><p>{it.detail}</p></article>))}
        <h3 className="ls-sub2"><span className="mono">{credentials.label}</span> {credentials.heading}</h3>
        {credentials.items.map((it) => (
          <article key={it.title} className="ls-item"><p className="mono">{it.date}</p><h3>{it.title}</h3>{it.cert && <img className="ls-cert" src={it.cert.src} alt={it.cert.alt} width={640} loading="lazy" />}</article>))}
      </section>

      <section id="leadership" className="ls" aria-labelledby="l-lead">
        <p className="mono ls-no">{n("Leadership")} / 07 · Leadership</p>
        <h2 id="l-lead" className="ls-h">{leadership.heading}</h2>
        <p className="ls-sub">{leadership.sub}</p>
        {leadership.items.map((it) => (
          <article key={it.title} className="ls-item"><p className="mono">{it.date}</p><h3>{it.title}</h3><p>{it.detail}</p>{it.chips && <ul className="ls-chips">{it.chips.map((c) => <li key={c}>{c}</li>)}</ul>}
            {it.link && <p className="ls-links"><a href={it.link.href} target="_blank" rel="noopener">{it.link.label}</a></p>}
            {it.orgKey && (<div className="ls-org"><p className="mono">Deliverables</p>{ciscoOrg.tiles.map((t) => (<div key={t.title}><h4>{t.title}</h4><p>{t.text}</p>{"link" in t && t.link && <a href={t.link.href} target="_blank" rel="noopener">{t.link.label}</a>}</div>))}</div>)}
          </article>))}
      </section>

      <section id="contact" className="ls" aria-labelledby="l-contact">
        <p className="mono ls-no">{n("Contact")} / 07 · Contact</p>
        <h2 id="l-contact" className="ls-h">{contact.heading}</h2>
        <p className="ls-lead">{contact.lead}</p>
        <p className="ls-links"><a href={`mailto:${profile.email}`}>{profile.email}</a><a href={profile.github} target="_blank" rel="noopener">GitHub</a><a href={profile.linkedin} target="_blank" rel="noopener">LinkedIn</a></p>
        <p className="mono ls-foot">{contact.footer}</p>
      </section>
    </div>
  );
}
