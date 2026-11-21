/* ALL role logic lives here. Edit this one file to change how the page re-cuts itself for a role.

   Every sentence below is built from facts already published on this site (projects.ts, profile.ts, skills.ts).
   `ev` ties a reason to the page element that proves it (a project, credential, organization or study). It drives
   the emphasis on the page and the red thread. The score of a role is the SUM of its reasons' weights, nothing else. */

export type RoleId = "data" | "dev" | "design";
export type RoleKey = "all" | RoleId;

/* A hero line is plain text with {hl} phrases that get the red marker underline. */
export type Seg = string | { hl: string };
export type Reason = { w: number; text: string; ev: string };

export type Role = {
  id: RoleId;
  label: string;
  hero: Seg[];
  projectOrder: string[];     // project slugs, first = shown first
  skills: string[];           // skill names highlighted for this role
  reasons: Reason[];
  notYet: string[];           // limits already published on the site
};

export const ROLES: Role[] = [
  {
    id: "data",
    label: "Data Analyst Intern",
    hero: [
      { hl: "BSIT (Data Science) student" }, " at PUP Manila and DOST-SEI merit scholar. I built an ",
      { hl: "explainable taste model" }, " in Re:Watch and a ", { hl: "face-shape classifier" },
      " in AURA that I held back from launch when it failed my own fairness check. Looking for ",
      { hl: "data science, analytics" }, " and technical internships. Based in Manila, Philippines.",
    ],
    /* AURA first: it reports held-out accuracy, a fairness gap and how many images were usable. */
    projectOrder: ["aura", "rewatch"],
    skills: ["Python", "SQL", "R", "Pandas", "NumPy", "scikit-learn", "Excel", "Power BI", "Data cleaning", "Exploratory data analysis", "Data visualization", "Machine learning", "Statistical analysis"],
    reasons: [
      { w: 20, text: "Built an explainable taste model in Re:Watch: every match score is the sum of the reasons listed under it", ev: "project-rewatch" },
      { w: 18, text: "Measured AURA's face-shape model on held-out data (57.3% on 839 images) and reported a 21.6-point accuracy gap across skin-tone bands", ev: "project-aura" },
      { w: 12, text: "DataCamp Associate Data Analyst certification, Aug 2026", ev: "cred-ada" },
      { w: 8, text: "DataCamp Associate Data Analyst in SQL career track, 39 hours", ev: "cred-sql" },
      { w: 8, text: "Cisco Networking Academy course: Data Analytics Essentials", ev: "cred-dae" },
      { w: 10, text: "Strategy and Insights Associate at Google Developer Groups on Campus, PUP: turning research and data into insights", ev: "org-gdg" },
      { w: 6, text: "BS Information Technology, Data Science at PUP Manila", ev: "exp-bsit" },
    ],
    notYet: [
      "Re:Watch has no offline evaluation against held-out ratings yet, so I make no accuracy claim for it.",
      "AURA's face-shape model currently fails my fairness gate, so it is not cleared for launch.",
    ],
  },
  {
    id: "dev",
    label: "Developer",
    hero: [
      "I build software across the stack. ", { hl: "Re:Watch" }, " (React, Java, Spring Boot, PostgreSQL) is ",
      { hl: "deployed" }, " and ", { hl: "AURA" }, " (React, FastAPI, Capacitor) is in development. Looking for technical internships. Based in Manila, Philippines.",
    ],
    projectOrder: ["rewatch", "aura"],
    skills: ["Java", "Python", "SQL", "HTML", "CSS", "JavaScript", "React", "Spring Boot", "FastAPI", "REST APIs", "PostgreSQL", "Database design", "Git", "GitHub"],
    reasons: [
      { w: 20, text: "Deployed Re:Watch: React, Java, Spring Boot and PostgreSQL, hosted on Vercel, Render and Neon", ev: "project-rewatch" },
      { w: 10, text: "Re:Watch runs JUnit, Playwright and axe-core accessibility audits in CI", ev: "project-rewatch" },
      { w: 7, text: "A test of 200 randomized trials checks that every Re:Watch score equals the sum of its reasons", ev: "project-rewatch" },
      { w: 15, text: "AURA: a React and Capacitor app with a FastAPI backend and Supabase row-level security, in development", ev: "project-aura" },
      { w: 8, text: "AURA is private by design: no image column, the API rejects extra fields, and consent is logged before the camera opens", ev: "project-aura" },
      { w: 5, text: "DataCamp Associate Data Analyst in SQL career track, 39 hours", ev: "cred-sql" },
      { w: 5, text: "BS Information Technology at PUP Manila", ev: "exp-bsit" },
    ],
    notYet: ["AURA is still in development: the Google Play launch is not done."],
  },
  {
    id: "design",
    label: "Designer",
    hero: [
      "I design event recap posts and other graphics as ", { hl: "Graphic Designer" }, " for Cisco NetConnect at PUP, and I use ",
      { hl: "Figma" }, " in my projects, including AURA. Looking for technical internships. Based in Manila, Philippines.",
    ],
    /* AURA first: it is the project that uses Figma and shows its screens as design mock-ups. */
    projectOrder: ["aura", "rewatch"],
    skills: ["Figma", "HTML", "CSS"],
    reasons: [
      { w: 20, text: "Graphic Designer, Creatives Department at Cisco NetConnect: I design event recap posts and other graphics for its Facebook page", ev: "org-cisco" },
      { w: 8, text: "I use Figma in AURA", ev: "project-aura" },
      { w: 8, text: "AURA shows its confidence and falls back to a short colour quiz instead of guessing when it is unsure", ev: "project-aura" },
      { w: 6, text: "Re:Watch explains each match trait by trait on its match screen", ev: "project-rewatch" },
      { w: 3, text: "Re:Watch is checked with axe-core accessibility audits", ev: "project-rewatch" },
      { w: 3, text: "One of my event recap posts is published on Facebook", ev: "org-cisco" },
    ],
    notYet: ["I have not published a design case study yet."],
  },
];

export const ROLE_IDS = ROLES.map((r) => r.id) as RoleId[];
export const roleById = (id: RoleId) => ROLES.find((r) => r.id === id)!;
export const score = (r: Role) => r.reasons.reduce((n, x) => n + x.w, 0);
export const SCORE_MAX = 100;

/* Which roles a skill / piece of evidence matters to. Derived from the data above, never typed twice. */
export const skillRoles = (name: string): RoleId[] => ROLES.filter((r) => r.skills.includes(name)).map((r) => r.id);
export const evRoles = (ev: string): RoleId[] => ROLES.filter((r) => r.reasons.some((x) => x.ev === ev)).map((r) => r.id);

/* Stable ids for the evidence rows the page already shows. */
const EV_BY_TITLE: Record<string, string> = {
  "BS Information Technology, Data Science": "exp-bsit",
  "Merit Scholar": "exp-dost",
  "Global Consumer Intelligence (GCI) program": "exp-gci",
  "Associate Data Analyst": "cred-ada",
  "Data Analytics Essentials": "cred-dae",
  "Associate Data Analyst in SQL": "cred-sql",
  "Graphic Designer, Creatives Department": "org-cisco",
  "Logistics & Resource Operations Member": "org-ibits",
  "Strategy and Insights Associate (Strategic Department)": "org-gdg",
};
export const evOf = (title: string) => EV_BY_TITLE[title];
export const evAttrs = (title: string) => {
  const ev = EV_BY_TITLE[title];
  return ev ? { "data-ev": ev, "data-roles": evRoles(ev).join(" ") } : {};
};
