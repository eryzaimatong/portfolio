"use client";
import { useEffect, useRef, useState } from "react";
import { profile, contact } from "@/data/profile";
import { gsap, registerGsap, slamText, isReduced } from "@/lib/motion";
import { useMotion } from "@/lib/motion-context";
import { MagneticButton } from "./MagneticButton";
import { getLenis } from "@/lib/velocity";
import { SectionStrip } from "./SectionStrip";

/* Closing credits: the contact details roll up, the email is the biggest thing on screen, then a quiet sign-off. */
export function Contact() {
  const root = useRef<HTMLElement>(null);
  const { reduced } = useMotion();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    registerGsap();
    const el = root.current!;
    const h = el.querySelector("[data-slam]"); if (h) slamText(h);
    if (isReduced()) return;
    const ctx = gsap.context(() => {
      gsap.from(".credit", { opacity: 0, y: 40, duration: 0.7, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: ".credits", start: "top 80%", once: true } });
      gsap.fromTo(".credits-line", { scaleY: 0 }, { scaleY: 1, transformOrigin: "50% 0", ease: "none", scrollTrigger: { trigger: el, start: "top 60%", end: "bottom bottom", scrub: true } });
    }, el);
    return () => ctx.revert();
  }, [reduced]);

  const copy = async () => { try { await navigator.clipboard.writeText(profile.email); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {} };

  return (
    <section id="contact" className="contact" ref={root} aria-labelledby="contactTitle">
      <SectionStrip word="Contact" />
      <div className="credits-line" aria-hidden="true" />
      <p className="mono label">Contact</p>
      <h2 id="contactTitle" className="h2 big slam" data-slam>{contact.heading}</h2>
      <div className="credits">
        <p className="credit contact-lead">{contact.lead}</p>
        <div className="credit"><MagneticButton as="a" className="mail-giant" href={`mailto:${profile.email}`} aria-label={`Email ${profile.email}, opens your mail app`} strength={0.25}><small>email ↗</small>{profile.email}</MagneticButton></div>
        <p className="credit contact-links">
          <a href={profile.github} target="_blank" rel="noopener" aria-label="github, opens in a new tab">github ↗</a>
          <a href={profile.linkedin} target="_blank" rel="noopener" aria-label="linkedin, opens in a new tab" id="linkedin">linkedin ↗</a>
          <button type="button" onClick={copy}>{copied ? "copied" : "copy address"}</button>
        </p>
        <p className="credit avail-line"><span className="avail"><i aria-hidden="true" />{profile.availability}</span> {profile.availabilityNote}</p>
      </div>
      <footer className="foot">
        <p className="mono">{contact.footer}</p>
        <p className="tbc" aria-hidden="true">To be continued ▸</p>
        <button type="button" className="ghost sm" onClick={() => { const l = getLenis(); if (l) l.scrollTo(0); else window.scrollTo({ top: 0 }); }} aria-label="Back to top">back to top ↑</button>
      </footer>
    </section>
  );
}
