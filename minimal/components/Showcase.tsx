"use client";
import { useRef } from "react";
import { useThreeScene } from "./three/runtime";

/* The opening screen: the crystal, featured, with the site's title. A still render of the crystal is shown at first paint;
   the live scene fades in over it on the first interaction (Three.js never loads during the first load). */
export function Showcase() {
  const host = useRef<HTMLDivElement>(null);
  useThreeScene(host, () => import("./three/heroCrystal"), {
    name: "showcase",
    near: "0px",
    get props() { return { photo: host.current!.querySelector(".sc-anchor") as HTMLElement, center: true }; },
  });
  return (
    <section id="home" className="showcase" aria-label="Home">
      <div ref={host} className="sc-3d" aria-hidden="true">
        <img className="sc-poster" src="/assets/crystal-poster.webp" alt="" width={1204} height={900} fetchPriority="high" />
        <i className="sc-anchor" />
      </div>
      <div className="sc-copy">
        <h1 className="sc-title pixel">developer<span className="sc-dot">.</span>yza<i className="caret" aria-hidden="true" /></h1>
        <p className="sc-sub mono">Eryza Mae Imatong · Data Science, Analytics &amp; Developer</p>
        <p className="sc-pitch">BSIT (Data Science) student at PUP Manila, open to data science, analytics and technical internships.</p>
      </div>
      <a className="sc-cue mono" href="#hello">scroll <span aria-hidden="true">↓</span></a>
    </section>
  );
}
