import { skillGroups } from "@/data/skills";
import logos from "@/data/logos.json";

type Logo = { path: string; hex: string; title: string };
const LOGOS = logos as Record<string, Logo>;

/* The full skills list, by group. Used under the corridor (as its accessible version) and on the /skills page. */
export function SkillGroups({ headingLevel = 3 }: { headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <>
      {skillGroups.map((g) => (
        <div key={g.id} className="sk-group">
          <H className="mono">{g.name}</H>
          <ul className="chips">
            {g.skills.map((s) => {
              const l = LOGOS[s.name];
              return (
                <li key={s.name} className={s.used ? "used" : ""}>
                  {l && <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d={l.path} fill="currentColor" /></svg>}
                  {s.name}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}
