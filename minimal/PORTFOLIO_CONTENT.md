# Portfolio content inventory: Eryza Mae Imatong

Everything that is on the portfolio, in one place, so it can be rebuilt in any design without hunting through code.
All wording below is copied from the live site's data files (`minimal/data/*.ts`) and components. Nothing here is new copy.

- **Live site:** https://eryzaimatong.vercel.app
- **Repository:** https://github.com/eryzaimatong/portfolio (this version: branch `v13-minimal`, folder `minimal/`)
- **Where the text lives in code:** `data/profile.ts` (profile, about, experience, leadership, credentials, contact), `data/projects.ts` (projects), `data/skills.ts` (skills), `data/logos.json` (skill icon paths), `app/layout.tsx` (SEO).
- **Other versions in the same repo:** the 3D "Curiosity Archive" museum (repo root, branch `v12-archive`), the KURENAI rebuild (`v11-kurenai`), the static NEO//FRAME site (`v10`). This file covers the minimal red and black version.

---

## 1. Identity and contact

| Field | Value |
|---|---|
| Name | Eryza Mae Imatong |
| Kicker / title line | Data Science, Analytics & Developer |
| Availability badge | Open to internships |
| Availability note | Looking for data science, analytics and technical internships. Based in Manila, Philippines. |
| Email | imatongeryzamae@gmail.com |
| GitHub | https://github.com/eryzaimatong |
| LinkedIn | https://www.linkedin.com/in/eryza-mae-imatong/ |
| Location | Manila, Philippines |
| Site tagline (meta description) | BSIT (Data Science) student at PUP Manila and DOST-SEI merit scholar. Projects in recommendation systems, machine learning and software development. Looking for data science, analytics and technical internships. |

## 2. Site structure (navigation order)

Sidebar (desktop) / top bar with menu (mobile), numbered 00 to 06:

| # | Section | Anchor |
|---|---|---|
| 00 | Home | `#home` |
| 01 | About | `#about` |
| 02 | Projects | `#projects` |
| 03 | Skills | `#skills` |
| 04 | Experience | `#experience` |
| 05 | Leadership | `#leadership` |
| 06 | Contact | `#contact` |

Sidebar extras: brand mark and name, a hint "← → browse projects", the availability status ("Open to internships"), "reach me at" with the email, and a "copy address" button.

## 3. Home (hero)

- **Name (H1):** Eryza Mae Imatong
- **Kicker:** Data Science, Analytics & Developer
- **Intro:** BSIT student at PUP Manila, specializing in Data Science. Looking for data science, analytics and technical internships. Based in Manila, Philippines.
  - Phrases that get the red marker underline: "BSIT student", "PUP Manila", "Data Science", "data science, analytics and technical internships".
  - "Manila, Philippines." is set in the serif italic accent.
- **Links:** github ↗, linkedin ↗, email ↗
- **Portrait:** black and white photo with the red valves and lips kept in colour. A red scan line sweeps down once and full colour develops behind it; hovering runs it again.
  - Alt text: "Eryza Mae Imatong looking back over her shoulder beside a concrete wall of red valves. The photo starts in black and white and turns to full colour."
  - Caption: Eryza Mae Imatong

## 4. About (01)

- **Heading:** Hello, I am Eryza
- **Lead:** BSIT student at PUP Manila, specializing in Data Science, and a DOST-SEI merit scholar.
- **Paragraph 1:** I'm most interested in data science and analytics: working out what a dataset can honestly say, and how sure we can be about it. I also build software, so I can turn analysis into tools people use.
- **Paragraph 2:** In Re:Watch I built an explainable taste model; in AURA I trained a face-shape classifier and held it back from launch when it failed my own fairness check. I'm looking for data science, analytics and technical internships.
- **Facts table:**

| Label | Value |
|---|---|
| Program | BS Information Technology, Data Science |
| University | Polytechnic University of the Philippines, Manila |
| Scholarship | DOST-SEI merit scholar |
| Expected graduation | 2028 |
| Featured projects | 2 |
| Credentials | 3 |

- Older portrait file (not used in the minimal site): `/assets/eryza.png`, alt "Portrait of Eryza Mae Imatong".

## 5. Projects (02)

Section subtitle: **Two public projects, each built around a real problem.**
Link at the section header: "all projects on github →" (https://github.com/eryzaimatong).
Presentation: a hologram carousel showing only the main picture of each project. Details open in a "case file" dialog with a picture gallery and four tabs: **Overview**, **How it works**, **Stack and contribution**, **Status and limits**. Buttons in the dialog: View on GitHub, Live demo.

### 5.1 Re:Watch

- **Eyebrow:** Project 01 // Recommender · Web app
- **Tagline:** Finds movies, TV, anime and K-drama by how you want to feel. Match scores come from a taste model I built, and every score lists the reasons that add up to it.
- **Year:** 2026 · **Role:** Solo project · **Timeline:** Jul 2026 to present · **Status:** Deployed
- **Note:** The free-tier backend sleeps when idle, so the first load can take a couple of minutes.
- **Links:** GitHub https://github.com/eryzaimatong/rewatch · Live demo https://rewatch-stories.vercel.app
- **Key numbers:**
  - **10**: taste traits in every profile
  - **3**: hosted services: Vercel, Render and Neon
  - **200**: randomized trials in the test that checks every score equals the sum of its reasons
- **The problem:** Recommenders usually rank by genre and popularity, so two titles with the same tag can feel nothing alike. Re:Watch is for people who scroll longer than they watch, and for groups choosing something together.
- **How it works:** Each title and each person is a ten-trait vector (family, nostalgia, pacing, humor, comfort and others). A title's vector is derived from TMDB genres and a keyword lexicon I wrote by hand. A person's profile is rebuilt by replaying their rating history, and a match score is the sum of per-trait contributions, so the reasons always add up to the number shown. Movie Night lets friends answer five questions on their own phones and ranks titles so agreement beats one strong veto.
- **Status and limits:** Built and deployed: everything described above. Limits: the keyword lexicon is hand-written, not learned. Not done yet: an offline evaluation of the recommendations against held-out ratings, so I make no accuracy claim.
- **Technical decisions:**
  1. Replay, not mutation: rebuilding the profile from the rating log makes re-rating and lexicon changes safe, and produces the taste-evolution timeline for free.
  2. Fixed scoring constants: a title shows the same percentage everywhere and does not drift when other titles are added.
  3. Contributions can go negative, so "tensions" are real, and rounding keeps the printed parts summing to the whole.
  4. Backend: Spring Boot, stateless JWT, Flyway migrations. Checks: JUnit, Playwright and axe-core accessibility audits, run in CI.
- **Stack:** React, Java, Spring Boot, PostgreSQL, Flyway, Playwright, Vercel, Render, Neon
- **Gallery** (note: "Screens from the running app. Poster art is a generated placeholder."; ratio 1000 × 625):
  1. `rewatch-01-home.jpg`: Home with a match score
  2. `rewatch-02-moods.jpg`: Mood picker
  3. `rewatch-03-match.jpg`: A match explained trait by trait
  4. `rewatch-04-taste-dna.jpg`: Taste DNA profile
  5. `rewatch-05-movie-night.jpg`: Movie Night group results
  6. `rewatch-06-community.jpg`: Community and similar taste
- **Logo:** `rewatch-logo.png`, alt "Re:Watch logo", background `#101b33`

### 5.2 AURA

- **Eyebrow:** Project 02 // Mobile · In development
- **Tagline:** A mobile app (in development) that reads a selfie on your phone to estimate face shape and colour season, then suggests makeup and outfits from your own wardrobe.
- **Year:** 2026 · **Role:** Personal project · **Timeline:** Oct 2026 to present · **Status:** In development, launch not cleared
- **Link:** GitHub https://github.com/eryzaimatong/aura (no live demo)
- **Key numbers:**
  - **57.3%**: held-out accuracy of the face-shape model (839 images, 5 classes)
  - **21.6 pts**: accuracy gap across skin-tone bands, against my 5-point limit
  - **4,146**: usable images out of 5,000 measured
- **The problem:** Online style advice is generic, and many apps send your photo to a server. AURA works from your own features and keeps the selfie on the device.
- **How it works:** MediaPipe runs on the phone and reduces the selfie to a few numbers: five face ratios, colour values, a skin-tone band and a lighting score. Only those numbers reach a FastAPI backend, which stores them in Supabase with row-level security. A scikit-learn random forest estimates face shape, and the code includes a CLIP-based garment tagger for the wardrobe. The React app is wrapped for Android with Capacitor.
- **Status and limits:** Built in code: the scan pipeline, wardrobe, outfits and wear log. In development: improving the face-shape model so it passes the fairness gate. Not done: the Google Play launch.
- **Technical decisions:**
  1. Privacy by design: there is no image column, the API rejects extra fields, and consent is logged before the camera opens.
  2. Fairness gate: the model is blocked from launch until accuracy is within 5 points across skin-tone bands. It currently fails, and I report that.
  3. Honest outputs: confidence is always shown, and low colour confidence leads to a short quiz instead of a guess.
- **Stack:** React, TypeScript, Vite, Tailwind CSS, Capacitor, FastAPI, Python, scikit-learn, MediaPipe, Supabase, Figma
- **Gallery** (note: "Design mock-ups of the screens from the AURA repository. The app is still in development."; ratio 390 × 844):
  1. `aura-01-welcome.png`: Welcome
  2. `aura-02-card.png`: Your Aura Card
  3. `aura-03-for-you.png`: Makeup picks
  4. `aura-04-closet.png`: The Closet
  5. `aura-05-privacy.png`: Data and privacy
- **Logo:** `aura-logo.png`, alt "AURA logo: Mira, the mirror ghost", background `#fdf6ec` (also `aura-logo-card.png`)

## 6. Skills (03)

Subtitle: **What I work with across data and software, plus the tools I use to build and collaborate.**
Each skill is a chip with an icon where one exists. A skill marked **(used)** is shown lit because it is used in a project; the projects named are the ones the site states.

| Group | Skills |
|---|---|
| Programming | Python (used, AURA), Java (used, Re:Watch), SQL (used), R, COBOL |
| Data science and analytics | Pandas, NumPy (used, AURA), scikit-learn (used, AURA), Excel, Power BI, Data cleaning, Exploratory data analysis, Data visualization, Machine learning, Statistical analysis |
| Frontend | HTML (used), CSS (used), JavaScript (used), React (used, Re:Watch and AURA) |
| Backend and databases | Spring Boot (used, Re:Watch), FastAPI (used, AURA), REST APIs (used), PostgreSQL (used, Re:Watch), MySQL, Database design, Relational database management |
| Developer tools | VS Code, Git (used), GitHub (used), Figma (used, AURA), Cisco Packet Tracer, Workato |
| AI tools I use | Claude, ChatGPT, Claude Code, AI-assisted development, Prompt engineering |
| Collaboration | Slack, Notion, Discord, Microsoft Teams |

**Note under the skills:** A lit key is used in my projects. Re:Watch uses Java, Spring Boot, PostgreSQL and React; AURA uses Python, scikit-learn, NumPy and FastAPI.
Skill icons are SVG paths (Simple Icons) stored in `data/logos.json`, keyed by skill name.

## 7. Experience (04)

- **Heading:** Where I Have Been
- **Subtitle:** School, a scholarship, and a few programs that shaped how I work.

| Dates | Title | Organization | Detail | Logo |
|---|---|---|---|---|
| 2024 to 2028 (expected) | BS Information Technology, Data Science | Polytechnic University of the Philippines, Manila | Specializing in Data Science. | `seal-pup.png` (PUP seal) |
| 2024 to present | Merit Scholar | DOST-SEI (Department of Science and Technology) | Merit scholarship from the DOST Science Education Institute, 2024 cohort, supporting my BS degree. | `logo-dost-clean.png` (DOST logo) |
| Sep to Dec 2026 · in progress | Global Consumer Intelligence (GCI) program (links to https://weblab.t.u-tokyo.ac.jp/en/lecture/gci) | University of Tokyo, Matsuo-Iwasawa Lab (JICA-supported) | Online program: attend sessions, complete homework, join competitions and build a final project. | `logo-gci.png` (Matsuo-Iwasawa Lab, University of Tokyo) |

### Credentials (sub-heading under Experience)

Heading: **Credentials** · label: *Certification & training*. Each has a "view certificate" image.

| Date | Title | Issuer | Certificate image | Logo |
|---|---|---|---|---|
| DataCamp certification · Aug 2026 | Associate Data Analyst | DataCamp | `cert-datacamp.png` (alt "DataCamp Associate Data Analyst certificate") | `logo-datacamp.png` |
| Cisco Networking Academy course · Aug 2026 | Data Analytics Essentials | Cisco Networking Academy | `cert-cisco.png` (alt "Cisco Networking Academy Data Analytics Essentials certificate") | `logo-cna.png` |
| DataCamp career track, 39 hours · Aug 2026 | Associate Data Analyst in SQL | DataCamp | `cert-sql.png` (alt "DataCamp Associate Data Analyst in SQL certificate") | `logo-datacamp.png` |

Small monochrome "stamp" logos sit beside each experience and credential row and return to colour on hover.

## 8. Leadership (05)

- **Heading:** Beyond the Code
- **Subtitle:** Teams and communities I design for, build with, or help lead.
- **Presentation:** a switch panel: each team is a row with a toggle; flipping it lights the logo and opens the details. Several can be open at once; "switch all on/off" is available.

| Organization line | Role | Detail | Chips | Link | Logo |
|---|---|---|---|---|---|
| Cisco NetConnect · PUP – Manila | Graphic Designer, Creatives Department | Design event recap posts and other graphics for the organization's Facebook page. | Visual design, Figma | "View deliverables" opens the dialog below | `logo-netconnect.png` (Cisco NetConnect logo) |
| IBITS · Institute of Bachelors in Information Technology Studies | Logistics & Resource Operations Member | Member of the Program and Activities Department, working on logistics and resource operations. | Logistics, Event planning, Resource management | IBITS on Facebook: https://www.facebook.com/iBITS.Official | `logo-ibits.png` (IBITS logo) |
| Google Developer Groups on Campus · PUP · 2026–27 | Strategy and Insights Associate (Strategic Department) | Turning research and data into meaningful insights to guide organizational decisions, strategic planning, and performance evaluation. | Data Analysis, Strategic Planning, Research | none | `logo-gdg-pup.png` (Google Developer Groups on Campus, Polytechnic University of the Philippines logo) |

### Cisco NetConnect deliverables dialog

- **Organization:** Cisco NetConnect · PUP – Manila · **Role:** Graphic Designer, Creatives Department · label "Deliverables"
- **Tile 1:** *Social graphics* · **Event recap posts**: Post-event graphics that recap each activity for the community on Facebook. Chips: Visual design, Figma. Link: "View a published post on Facebook", https://www.facebook.com/share/p/1DscWrfCUx/
- **Tile 2:** *Page graphics* · **Designed to match each event**: Other graphics for the organization's page, built around each event's theme.

## 9. Contact (06)

- **Heading:** Let’s talk
- **Lead:** I'm looking for data science, analytics and technical internships. If you're hiring, or want to talk about Re:Watch or AURA, email me. Based in Manila, Philippines.
- **Buttons:** the email address (primary), github ↗, linkedin ↗
- **Footer:** Eryza Mae Imatong · Manila, Philippines, with "back to top ↑"

## 10. Page extras

- **404 page:** "This page doesn’t exist" · "It may have moved, or it never existed." · button "Back to the portfolio".
- **Search / sharing:** sitemap, robots, web manifest, Open Graph image (`og-image.png`, 1200 × 630: pixel name, EI mark and the photo), JSON-LD Person data, favicon (`icon.svg` plus PNGs).

## 11. Logo and brand

- **Mark:** a pixel "EI" monogram (Eryza Imatong) on a near-black rounded square, cream letters with a blinking blood-red cursor block. Source: `public/icon.svg`, `app/icon.svg`, component `components/Mark.tsx`. Exported as `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`.
- **Colours:** background `#0A0506`, surface `#120809`, line `#2B1418` / `#3a1a1f`, text `#F1ECEC`, dim text `#A89A9C`, blood red `#B3001B`, hot red `#E0112B`, text-safe red `#FF6B79`.
- **Fonts:** Geist (body), Geist Mono (labels, UI), Geist Pixel Square (headings and name), Source Serif 4 italic (accent, e.g. "Manila, Philippines.").
- **Layout:** fixed 236 px sidebar plus a 760 px reading column; below 900 px the sidebar becomes a top bar with a menu.
- **Section headings:** numbered, mono-style, with a hairline that draws and a single red drip when scrolled into view.

## 12. Interactions to keep in mind when redesigning

- Projects carousel: scroll sideways, drag, arrow buttons, ← → keys; the middle item is the "hologram" (red duotone, scanlines, light band, corner brackets, float).
- Case file dialog: gallery with previous/next, four tabs, links.
- Certificate dialogs and the Cisco deliverables dialog (close with Esc).
- Leadership switch panel (above).
- Hero photo scan (black and white to colour), replays on hover.
- Reveal-on-scroll fade-up for blocks; reduced-motion shows everything immediately.
- "copy address" button in the sidebar; mobile menu overlay.

## 13. File map

**Images (`public/assets/`)**
- Hero photo: `hero-640.webp`, `hero-960.webp`, `hero-1280.webp`, `hero-960.jpg` (black and white with red kept), `hero-c-640/960/1280.webp` (full colour). Original (uncropped) photo came from the Figma file.
- Portraits and brand: `eryza.png`, `og-image.png`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`.
- Certificates: `cert-datacamp.png`, `cert-cisco.png`, `cert-sql.png`.
- Logos: `logo-cna.png`, `logo-datacamp.png`, `logo-dost-clean.png`, `logo-gci.png`, `logo-gdg-pup.png`, `logo-ibits.png`, `logo-netconnect.png`, `seal-pup.png`.
- Projects (`projects/`): `rewatch-01-home.jpg` to `rewatch-06-community.jpg`, `rewatch-logo.png`, `aura-01-welcome.png` to `aura-05-privacy.png`, `aura-logo.png`, `aura-logo-card.png`.

**Components (`components/`)**: `Hero`, `PhotoScan`, `Sidebar`, `HoloCarousel` (with the case file), `Sections` (About, Skills, Experience, Leadership, Contact), `LeadershipMap` (the switch panel), `Dialogs`, `Mark`, `Motion`.

## 14. Tech and hosting

- Next.js 16 (App Router, Turbopack), React 19, TypeScript, plain CSS (no Tailwind in this folder), `geist` fonts, Source Serif 4 via `next/font`.
- Hosted on Vercel, project `eryzaimatong` (production URL above). The project's production branch is `main`, so the minimal site is deployed to production from `v13-minimal` through a manual deployment, not by pushing.
- Free `.vercel.app` address; a custom domain was offered and declined.

## 15. Extra work that exists only in git history (not live)

Built on branch `v13-minimal` after the live version and then rolled back at the owner's request. Still retrievable from git (commits `0164637`, `961a294`, `1db0430`, `f30b89b`):

- Role chips (Data Analyst Intern / Developer / Designer) with a single role data file, a Fit Report whose score is the sum of listed reasons, and `?role=` links.
- A "red thread" canvas that connects skills to the projects, org and credential where they were used.
- A face-landmark mesh scan over the portrait (landmarks precomputed with MediaPipe by `scripts/make-landmarks.py`, stored in `public/assets/hero-landmarks.json`).
- A Re:Watch "Taste DNA" radar demo with 40 sample titles (demo data, written for the demo).
- A cycling hero greeting (`print("hello")` → `SELECT 'hello'` → `こんにちは`).
- Performance fixes (lazy-loaded images, transform-only animations).
