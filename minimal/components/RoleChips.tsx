"use client";
import { ROLES, type RoleKey } from "@/data/roles";
import { useRole } from "./RoleContext";

const OPTIONS: { id: RoleKey; label: string }[] = [{ id: "all", label: "All" }, ...ROLES.map((r) => ({ id: r.id as RoleKey, label: r.label }))];

/* "View as": picking a role re-cuts the page. All is the default, so nothing is forced. */
export function RoleChips() {
  const { role, setRole } = useRole();
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const j = (i + d + OPTIONS.length) % OPTIONS.length;
    setRole(OPTIONS[j].id);
    (e.currentTarget.parentElement?.querySelectorAll("button")[j] as HTMLElement | undefined)?.focus();
  };
  return (
    <div className="roles" role="radiogroup" aria-label="View this portfolio as">
      <span className="roles-k mono" aria-hidden="true">view as</span>
      {OPTIONS.map((o, i) => (
        <button key={o.id} type="button" role="radio" aria-checked={role === o.id} tabIndex={role === o.id ? 0 : -1}
          className={"role-chip mono" + (role === o.id ? " on" : "")} onClick={() => setRole(o.id)} onKeyDown={(e) => onKey(e, i)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* A small button that picks a role (used by the fit report overview). */
export function RolePick({ id, className, children }: { id: RoleKey; className?: string; children: React.ReactNode }) {
  const { setRole } = useRole();
  return <button type="button" className={className} onClick={() => setRole(id)}>{children}</button>;
}
