/* Where each skill is actually used, for the red thread. Everything here is already published on the site:
   - skills.ts says which projects use a skill (its `projects` list),
   - the Cisco NetConnect role lists Figma among its skills,
   - the SQL credential is "Associate Data Analyst in SQL".
   A skill with no entry has no thread. Nothing is guessed. At most three threads are ever drawn for one skill. */
import { skillGroups } from "./skills";

const EXTRA: Record<string, string[]> = {
  Figma: ["org-cisco"],
  SQL: ["cred-sql"],
};

export const EV_LABEL: Record<string, string> = {
  "project-rewatch": "Re:Watch",
  "project-aura": "AURA",
  "org-cisco": "Cisco NetConnect",
  "cred-sql": "Associate Data Analyst in SQL",
};

const fromSkills = new Map<string, string[]>();
for (const g of skillGroups) for (const s of g.skills) fromSkills.set(s.name, (s.projects ?? []).map((p) => `project-${p}`));

export const evidenceFor = (skill: string): string[] => [...(fromSkills.get(skill) ?? []), ...(EXTRA[skill] ?? [])].slice(0, 3);
