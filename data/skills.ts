/* Tech stack, carried over from the existing portfolio. `used` = shown as used in projects; `projects` = which ones the site names. */
export type Skill = { name: string; used?: boolean; projects?: string[] };
export type SkillGroup = { id: string; name: string; skills: Skill[] };

const R = "rewatch", A = "aura";
export const skillGroups: SkillGroup[] = [
  { id: "programming", name: "Programming", skills: [
    { name: "Python", used: true, projects: [A] }, { name: "Java", used: true, projects: [R] }, { name: "SQL", used: true },
    { name: "R" }, { name: "COBOL" } ] },
  { id: "data", name: "Data science and analytics", skills: [
    { name: "Pandas" }, { name: "NumPy", used: true, projects: [A] }, { name: "scikit-learn", used: true, projects: [A] },
    { name: "Excel" }, { name: "Power BI" }, { name: "Data cleaning" }, { name: "Exploratory data analysis" },
    { name: "Data visualization" }, { name: "Machine learning" }, { name: "Statistical analysis" } ] },
  { id: "frontend", name: "Frontend", skills: [
    { name: "HTML", used: true }, { name: "CSS", used: true }, { name: "JavaScript", used: true }, { name: "React", used: true, projects: [R, A] } ] },
  { id: "backend", name: "Backend and databases", skills: [
    { name: "Spring Boot", used: true, projects: [R] }, { name: "FastAPI", used: true, projects: [A] }, { name: "REST APIs", used: true },
    { name: "PostgreSQL", used: true, projects: [R] }, { name: "MySQL" }, { name: "Database design" }, { name: "Relational database management" } ] },
  { id: "tools", name: "Developer tools", skills: [
    { name: "VS Code" }, { name: "Git", used: true }, { name: "GitHub", used: true }, { name: "Figma", used: true, projects: [A] },
    { name: "Cisco Packet Tracer" }, { name: "Workato" } ] },
  { id: "ai", name: "AI tools I use", skills: [
    { name: "Claude" }, { name: "ChatGPT" }, { name: "Claude Code" }, { name: "AI-assisted development" }, { name: "Prompt engineering" } ] },
  { id: "collab", name: "Collaboration", skills: [
    { name: "Slack" }, { name: "Notion" }, { name: "Discord" }, { name: "Microsoft Teams" } ] },
];

export const skillNote =
  "A lit key is used in my projects. Re:Watch uses Java, Spring Boot, PostgreSQL and React; AURA uses Python, scikit-learn, NumPy and FastAPI.";
