import { ROLES, SCORE_MAX, score } from "@/data/roles";
import { RolePick } from "./RoleChips";

/* Fit report: how my published work lines up with a role. The score is the sum of the weighted reasons listed under it.
   All four panels share one grid cell, so the height is fixed and switching roles never moves the page. */
export function FitReport() {
  return (
    <section className="fit" aria-labelledby="fit-h">
      <header className="fit-head">
        <h2 id="fit-h" className="mono">Fit report</h2>
        <p className="fit-sub dim">How my published work lines up with a role. Every point has a reason, and the score is only their sum.</p>
      </header>
      <div className="rl fit-body" aria-live="polite">
        <div data-for="all" className="fit-all">
          <p className="fit-pick dim">Pick a role above, or open one here:</p>
          <ul className="fit-bars">
            {ROLES.map((r) => (
              <li key={r.id}>
                <RolePick id={r.id} className="fit-bar">
                  <span className="fit-bar-name">{r.label}</span>
                  <span className="fit-track" aria-hidden="true"><i style={{ transform: `scaleX(${score(r) / SCORE_MAX})` }} /></span>
                  <span className="fit-bar-n mono">{score(r)}<small> / {SCORE_MAX}</small></span>
                </RolePick>
              </li>
            ))}
          </ul>
        </div>
        {ROLES.map((r) => (
          <div key={r.id} data-for={r.id} className="fit-role">
            <p className="fit-score"><b className="pixel">{score(r)}</b><span className="mono"> / {SCORE_MAX} · {r.label}</span></p>
            <ol className="fit-reasons">
              {r.reasons.map((x) => (
                <li key={x.text}><b className="mono">+{x.w}</b><span>{x.text}</span></li>
              ))}
            </ol>
            <p className="mono fit-ny">Not yet</p>
            <ul className="fit-notyet dim">{r.notYet.map((n) => <li key={n}>{n}</li>)}</ul>
          </div>
        ))}
      </div>
    </section>
  );
}
