# AUDIT: before "The Curiosity Archive"

Branch: `v12-archive` (cut from `v11-kurenai`). No application code has been changed yet.

## 1. What "the live site" is

The public site is the **`main`** branch (the "Chiaroscuro" design: plain HTML/CSS/JS, deployed by Vercel to `eryza-mae-imatong.vercel.app`). The Vercel project is **paused right now** (returns 503), so the live site cannot be fetched; everything below is read from `main` in git.

**Live-site navigation, in order (these are the names and order the museum must use, rule 9):**

`Home` · `About` · `Projects` · `Skills` · `Experience` · `Leadership` · `Contact`

That is exactly seven sections, so the seven-room plan fits, but **the order differs from the order in the brief** (see BLUEPRINT.md).

## 2. Repository state

| Branch | What it is |
|---|---|
| `main` | Live "Chiaroscuro" static site (paused on Vercel) |
| `v6-space`, `v7-chiaroscuro`, `v8-struck`, `v9-working` | Earlier redesigns, unmerged |
| `v10-neoframe` | NEO//FRAME static site (committed) |
| `v11-kurenai` | KURENAI: Next.js 16 + Tailwind 4 + GSAP rebuild (committed) |
| `v12-archive` | This work |

`v11-kurenai` layout: `app/` (App Router), `components/`, `data/{projects,profile,skills}.ts` (typed content), `lib/` (motion, scroll, navigation), `public/assets/` (all images and logos), `legacy/` (the old static files, unused).

**Dependencies today:** next 16.4, react 19, tailwindcss 4, gsap 3.15 (incl. ScrollTrigger, SplitText, Flip, Draggable, Inertia), lenis, d3, ogl, typescript.
**Not installed yet:** three, @react-three/fiber, @react-three/drei, postprocessing (and @react-three/postprocessing), detect-gpu, a KTX2/Basis toolchain, geist.

## 3. Existing functionality that must be preserved

- **Contact:** there is **no contact form** on the live site. Contact is `mailto:imatongeryzamae@gmail.com`, GitHub, LinkedIn and a "copy address" key. There is no backend, route or form handler to preserve.
- **SEO:** title, meta description, Open Graph and Twitter tags, canonical, JSON-LD `Person`, `robots.txt`, `sitemap.xml`, `site.webmanifest`, favicons. All are already carried into `app/layout.tsx` and `public/` on v11.
- **Analytics:** none found on `main` or v11.
- **Deploy:** Vercel, auto-deploy of `main`. v11/v12 are a Next.js app, so `main` would need the Next.js framework preset when this ships. `vercel.json` does not exist.
- **Dialogs on the live site:** project case studies (Re:Watch, AURA), the Cisco NetConnect deliverables, three certificate viewers. All are ported on v11 as Case File pages and modals.
- **Interactive extras on `main` not carried to v11:** the Re:Watch trait mixer ("Drag a dial..."), the AURA pipeline explainer ("only numbers leave the phone", "gap 21.6 > limit 5"), and the "Pick one up. Throw it." physics sandbox. These are interactive features, not content paragraphs. They are candidates for the Inspect panel of each exhibit, or can stay cut. **Needs your call.**

## 4. Content parity of v11 against `main`

Compared every text node in `main`'s body with the rendered v11 pages: 65 nodes, 6 missing, all from the interactive extras above plus the skills footnote wording ("Underlined: used in my projects..." became "A lit key is used in my projects..."). No facts are missing.

## 5. Performance and technical concerns for a 3D museum

1. **Real-time photorealism is the hard part.** Soft shadows, planar reflections, transmission glass, volumetric shafts, N8AO and a long camera path all at once is heavy. Plan: High / Balanced / Lite tiers with `detect-gpu`, baked lightmaps for walls and floors, one shadow-casting light per room, and a full non-3D Lite mode.
2. **Asset size.** PBR sets (colour, normal, roughness, AO) for 5-6 materials at 1-2k, plus an HDRI. Budget about 15-25 MB total, KTX2/WebP-compressed and lazy-loaded after first paint.
3. **Scroll model.** The brief requires native, unsmoothed 1:1 scroll. v11 uses Lenis; it must be **removed** on this branch, and the camera driven from `window.scrollY` in one `requestAnimationFrame` loop.
4. **No scroll-hijacking** also means the existing GSAP page transitions, wipes, impact frames, speed lines and preloader animation from v11 are not carried over (the brief forbids them in the museum).
5. **Texture sources reachable:** Poly Haven and ambientCG both responded from this machine, so real CC0 PBR textures can be downloaded (recorded in `CREDITS.md`). If a download later fails, procedural PBR maps are the fallback and will be reported.

## 6. Testing limits in this environment (honesty up front)

- The in-app browser pane renders WebGL, but its screenshots are cropped to roughly 800x500 px and animation timing is throttled when the pane is hidden. Headless Chrome screenshots worked for static pages but showed GPU-less rendering artefacts (backdrop-filter, blend modes). I can verify composition, materials and lighting from screenshots, but **I cannot measure real-GPU frame rate, and I cannot claim "photorealistic" without showing you the screenshots**. The gates in section 2.8 will be reported with the screenshots, including what still looks fake.

## 7. Plan

Phase 2 (BLUEPRINT.md) and the open questions in it come next. No code until the blueprint questions are answered.
