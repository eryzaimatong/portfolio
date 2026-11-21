/* Turns the skills list (data/skills.ts, the single source of truth) into corridor panels.
   Walls by meaning: data on the left, backend on the right, frontend on the ceiling, design and tools on the floor.
   The two "Programming" languages that belong to data (Python, SQL, R) go on the data wall; Java and COBOL on the backend wall. */
import { skillGroups } from "./skills";
import icons from "./skillIcons.json";
import { GLYPHS } from "./glyphs";
import type { Panel, Wall } from "@/components/three/skillsCorridor";

const PROJECT_NAME: Record<string, string> = { rewatch: "Re:Watch", aura: "AURA" };
const GROUP_WALL: Record<string, Wall> = { data: "left", backend: "right", frontend: "ceiling", tools: "floor", ai: "floor", collab: "floor" };
const DATA_LANGS = new Set(["Python", "SQL", "R"]);
const ICONS = icons as Record<string, { path: string; hex: string }>;

export function corridorPanels(): Panel[] {
  return skillGroups.flatMap((g) => g.skills.map((s) => {
    const wall: Wall = g.id === "programming" ? (DATA_LANGS.has(s.name) ? "left" : "right") : GROUP_WALL[g.id];
    const usedIn = s.projects?.length ? s.projects.map((p) => PROJECT_NAME[p] ?? p).join(" and ") : s.used ? "my projects" : null;
    const brand = ICONS[s.name] ? { path: ICONS[s.name].path, hex: ICONS[s.name].hex } : null;
    return { name: s.name, group: g.name, wall, usedIn, brand, glyph: brand ? null : GLYPHS[s.name] ?? null };
  }));
}
