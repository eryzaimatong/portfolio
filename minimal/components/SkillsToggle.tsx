"use client";
import { useState } from "react";

/* "View all skills": opens the full list right under the corridor instead of sending you to another page. */
export function SkillsToggle() {
  const [open, setOpen] = useState(false);
  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const wrap = e.currentTarget.closest(".sk3d");
    wrap?.classList.toggle("show-list", !open);
    if (!open) requestAnimationFrame(() => wrap?.querySelector(".sk-list")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    setOpen(!open);
  };
  return (
    <button type="button" className="sk-all mono" aria-expanded={open} aria-controls="skills-list" onClick={toggle}>
      {open ? "Hide the full list" : "View all skills"} <span aria-hidden="true">{open ? "↑" : "↓"}</span>
    </button>
  );
}
