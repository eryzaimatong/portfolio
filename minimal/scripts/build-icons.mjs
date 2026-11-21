// Builds data/skillIcons.json from the simple-icons package (CC0, https://simpleicons.org): one SVG path + brand colour
// per skill that has an official icon. Run after changing the skills list:  node scripts/build-icons.mjs
// Skills without an official icon get a custom glyph from data/glyphs.ts instead (never a text-only panel).
import * as si from "simple-icons";
import { writeFileSync } from "node:fs";

const MAP = {
  Python: "siPython", Java: "siOpenjdk", R: "siR", Pandas: "siPandas", NumPy: "siNumpy", "scikit-learn": "siScikitlearn",
  HTML: "siHtml5", CSS: "siCss", JavaScript: "siJavascript", React: "siReact",
  "Spring Boot": "siSpringboot", FastAPI: "siFastapi", PostgreSQL: "siPostgresql", MySQL: "siMysql",
  Git: "siGit", GitHub: "siGithub", Figma: "siFigma", "Cisco Packet Tracer": "siCisco",
  Claude: "siClaude", "Claude Code": "siClaude", Notion: "siNotion", Discord: "siDiscord",
};
const out = {};
for (const [skill, key] of Object.entries(MAP)) {
  const icon = si[key];
  if (!icon) { console.warn("missing in simple-icons:", skill, key); continue; }
  out[skill] = { title: icon.title, path: icon.path, hex: "#" + icon.hex };
}
writeFileSync(new URL("../data/skillIcons.json", import.meta.url), JSON.stringify(out, null, 0) + "\n");
console.log(`wrote ${Object.keys(out).length} icons`);
