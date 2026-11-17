"use client";
import { useState } from "react";
import { OrgButton, type Tile } from "./Dialogs";
import { Mark } from "./Mark";

type Item = { date: string; title: string; detail: string; chips?: string[]; link?: { href: string; label: string }; orgKey?: string; badge?: { src: string; alt: string } };
type Cisco = { org: string; role: string; tiles: Tile[] };

/* An org chart: Eryza at the root, one branch per team. The selected branch is lit; its details open underneath. */
export function LeadershipMap({ items, cisco, name }: { items: Item[]; cisco: Cisco; name: string }) {
  const [on, setOn] = useState(0);
  const [hot, setHot] = useState<number | null>(null);
  const n = items.length;
  const sel = items[on];
  const rowY = (i: number) => ((i + 0.5) / n) * 100;
  const move = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const j = (i + d + n) % n;
    setOn(j);
    (e.currentTarget.parentElement?.children[j] as HTMLElement | undefined)?.focus();
  };

  return (
    <div className="org">
      <div className="org-chart">
        <div className="org-root">
          <Mark size={34} />
          <p className="org-root-name">{name}</p>
          <p className="mono org-root-tag">teams I serve</p>
        </div>
        <svg className="org-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {items.map((_, i) => (
            <path key={i} d={`M0 50 H46 V${rowY(i)} H100`} vectorEffect="non-scaling-stroke" className={"org-line" + (i === on ? " is-on" : "") + (i === hot ? " is-hot" : "")} />
          ))}
        </svg>
        <div className="org-nodes" role="tablist" aria-label="Teams" aria-orientation="vertical">
          {items.map((it, i) => (
            <button key={it.title} type="button" role="tab" id={`org-tab-${i}`} aria-selected={i === on} aria-controls="org-panel" tabIndex={i === on ? 0 : -1}
              className={"org-node" + (i === on ? " is-on" : "")}
              onClick={() => setOn(i)} onKeyDown={(e) => move(e, i)}
              onMouseEnter={() => setHot(i)} onMouseLeave={() => setHot(null)} onFocus={() => setHot(i)} onBlur={() => setHot(null)}>
              {it.badge && <img className="org-logo" src={it.badge.src} alt="" width={40} height={40} loading="lazy" />}
              <span className="org-node-text">
                <span className="mono org-node-org">{it.date}</span>
                <span className="org-node-role">{it.title}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
      <div id="org-panel" role="tabpanel" aria-labelledby={`org-tab-${on}`} className="org-panel" key={on}>
        <p className="mono org-panel-k">role {String(on + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</p>
        <p className="org-panel-d">{sel.detail}</p>
        {sel.chips && <ul className="chips">{sel.chips.map((c) => <li key={c}>{c}</li>)}</ul>}
        <div className="org-panel-links">
          {sel.link && <a className="link mono" href={sel.link.href} target="_blank" rel="noopener">{sel.link.label} →</a>}
          {sel.orgKey === "cisco" && <OrgButton org={cisco.org} role={cisco.role} tiles={cisco.tiles} />}
        </div>
      </div>
    </div>
  );
}
