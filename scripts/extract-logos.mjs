// Build-time helper: pulls only the icons we need out of `simple-icons` into data/logos.json (path data + brand hex).
// Skills with no matching icon are listed in `missing` and get a typographic mark in the scene.
import * as si from "simple-icons";
import { writeFileSync } from "node:fs";

const MAP = {
  Python: "siPython", Java: "siOpenjdk", R: "siR", Pandas: "siPandas", NumPy: "siNumpy", "scikit-learn": "siScikitlearn",
  "Power BI": "siPowerbi", HTML: "siHtml5", CSS: "siCss", JavaScript: "siJavascript", React: "siReact", "Spring Boot": "siSpringboot",
  FastAPI: "siFastapi", PostgreSQL: "siPostgresql", MySQL: "siMysql", "VS Code": "siVisualstudiocode", Git: "siGit", GitHub: "siGithub",
  Figma: "siFigma", "Cisco Packet Tracer": "siCisco", Claude: "siClaude", "Claude Code": "siClaude", ChatGPT: "siOpenai", Notion: "siNotion", Discord: "siDiscord", Slack: "siSlack",
  Excel: "siMicrosoftexcel", "Microsoft Teams": "siMicrosoftteams",
};
const out = {}, missing = [];
for (const [name, key] of Object.entries(MAP)) {
  const icon = si[key];
  if (icon) out[name] = { path: icon.path, hex: icon.hex, title: icon.title };
  else missing.push(`${name} (${key})`);
}
writeFileSync(new URL("../data/logos.json", import.meta.url), JSON.stringify(out));
console.log("icons:", Object.keys(out).length, "\nnot in simple-icons:", missing.join(", ") || "none");
