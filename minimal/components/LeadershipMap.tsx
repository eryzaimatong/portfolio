"use client";
import { useState } from "react";
import { OrgButton, type Tile } from "./Dialogs";
import { evAttrs } from "@/data/roles";

type Item = { date: string; title: string; detail: string; chips?: string[]; link?: { href: string; label: string }; orgKey?: string; badge?: { src: string; alt: string } };
type Cisco = { org: string; role: string; tiles: Tile[] };

/* A control panel: one switch per team. Flip it on and the team's logo lights up and its details open. Several can be on at once. */
export function LeadershipMap({ items, cisco }: { items: Item[]; cisco: Cisco }) {
  const [on, setOn] = useState<Set<number>>(new Set([0]));
  const flip = (i: number) => setOn((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });
  const all = on.size === items.length;
  const setAll = () => setOn(all ? new Set() : new Set(items.map((_, i) => i)));

  return (
    <div className="pnl">
      <p className="pnl-bar mono">
        <span>{on.size} of {items.length} on</span>
        <button type="button" className="pnl-all" onClick={setAll}>{all ? "switch all off" : "switch all on"}</button>
      </p>
      <ul className="pnl-list">
        {items.map((it, i) => {
          const lit = on.has(i);
          return (
            <li key={it.title} className={"pnl-row" + (lit ? " is-on" : "")} {...evAttrs(it.title)}>
              <button type="button" role="switch" aria-checked={lit} aria-controls={`pnl-d-${i}`} className="pnl-head" onClick={() => flip(i)}>
                <span className="pnl-sw" aria-hidden="true"><i /></span>
                {it.badge && <img className="pnl-logo" src={it.badge.src} alt="" width={40} height={40} loading="lazy" />}
                <span className="pnl-text">
                  <span className="mono pnl-org">{it.date}</span>
                  <span className="pnl-role">{it.title}</span>
                </span>
                <span className="mono pnl-state" aria-hidden="true">{lit ? "on" : "off"}</span>
              </button>
              <div id={`pnl-d-${i}`} className="pnl-body" role="region" aria-label={`${it.title} details`} inert={!lit}>
                <div className="pnl-inner">
                  <p className="pnl-detail">{it.detail}</p>
                  {it.chips && <ul className="chips">{it.chips.map((c) => <li key={c}>{c}</li>)}</ul>}
                  <div className="pnl-links">
                    {it.link && <a className="link mono" href={it.link.href} target="_blank" rel="noopener">{it.link.label} →</a>}
                    {it.orgKey === "cisco" && <OrgButton org={cisco.org} role={cisco.role} tiles={cisco.tiles} />}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
