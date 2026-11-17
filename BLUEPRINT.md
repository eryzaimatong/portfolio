# BLUEPRINT: The Curiosity Archive

## Room map (live names and live order, rule 9)

The brief's room order is Experience before Collection / Exhibitions / Skills. The live site's order is different, and rule 9 says the live order wins. The walk therefore goes:

| Room | On-screen name (live) | Working label | Feature |
|---|---|---|---|
| 1 / 7 | **Home** | Welcome Hall | Name and identity on the back wall, lights-up entrance (once per session, skippable) |
| 2 / 7 | **About** | The Curator | Portrait (`eryza.png`) warming from grey to colour, four wall labels from the existing sentences |
| 3 / 7 | **Projects** | The Exhibitions | Curved wall, 2 framed works (Re:Watch, AURA), spotlight, dust, Inspect panel |
| 4 / 7 | **Skills** | Skills Hallway | Pale limestone hallway, logos pasted on the wall in the 7 live categories |
| 5 / 7 | **Experience** | Experience | Three alcoves: School (PUP), Scholarship + program (DOST-SEI, GCI), Credentials (3 certificates) |
| 6 / 7 | **Leadership** | The Collection | Three floating glass cubes with extruded logos (Cisco NetConnect, IBITS, GDG on Campus PUP) |
| 7 / 7 | **Contact** | The Future Wing | Lit doorway, closing line, email / GitHub / LinkedIn / copy address (form only if you choose one) |

Consequences to flag:
- The Projects wall has **two** exhibits, not a long arc. The arc is still curved and the steering and spotlight work, but with two frames it will feel sparse; the six Re:Watch and five AURA screenshots appear in the Inspect viewer, not on the wall.
- Credentials are inside Experience, so the third alcove holds them (matches the brief).
- Skills before Experience means the pale limestone hallway comes right after the dark Projects room, then the walk returns to a dark semicircular room; the value change at each doorway must be smooth.

## Stack

Keep **Next.js 16 + React 19 + Tailwind** (already on this branch). Add: `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` + `postprocessing`, `detect-gpu`, `geist`, `gsap` (kept for HTML panel transitions only). **Remove Lenis** (scroll must be native and 1:1). Remove the KURENAI motion layer (wipes, impact frames, speed lines, preloader, magnetic buttons, cursor); none are allowed in the museum.

```
app/layout.tsx          fonts, metadata (kept), providers
app/page.tsx            <Museum/> (3D) + <LiteSite/> (HTML) chosen by tier
components/museum/      Canvas shell, CameraRig (scroll -> spline), Rooms/*, Materials, LightRig, Post, Dust, Volumetrics
components/ui/          TopBar, Directory overlay, ProgressLine, InspectPanel, WallLabels (HTML)
components/lite/        The same seven sections as plain HTML (also the SSR/no-JS content)
data/*.ts               unchanged content (single source for 3D and Lite)
public/textures/        KTX2 / WebP PBR sets;  public/hdri/  one dim interior HDRI
scripts/material-audit  walks the scene and fails on flat materials (gate 1)
```

All text is HTML overlaid on a fixed canvas; SSR renders the Lite content so crawlers and no-JS users get everything.

## Scroll model
Page height = sum of per-room scroll lengths (about 10 screen-heights in total). One `requestAnimationFrame` loop reads `window.scrollY`, maps it 1:1 to a position on a Catmull-Rom path through the connected floor plan, and sets the camera. No lerp, no snap. Nav clicks use a 0.6 s native `scrollTo`. Hash updates with `history.replaceState`; `scrollRestoration = "manual"` plus saved position. Inspect / panels lock scroll only while open and restore the exact position.

## Look
- Textures: Poly Haven / ambientCG CC0 (board-formed concrete, plaster, terrazzo/honed stone, limestone, oak, brushed brass), 2k, KTX2 or WebP, with tiling offsets. Logged in `CREDITS.md`. Fallback: procedural PBR with a plain report.
- Light: dim interior HDRI, ACES tone mapping, one shadow-casting spotlight per room, RectAreaLights for ceiling slits and the doorway, baked lightmaps for static architecture, drei `MeshReflectorMaterial` floor, `MeshPhysicalMaterial` transmission cubes, N8AO, subtle bloom, vignette, fine grain.
- Camera: FOV 40, eye height 1.6 m, real-world scale.
- Tiers: High / Balanced / Lite via `detect-gpu`; Lite and `prefers-reduced-motion` use the HTML layout with identical content.

## Build order and gates
Phase 3 foundation, then rooms in this order: Projects, Home, About, Leadership (Collection), Skills, Experience, Contact. After **each** room: material audit, light audit, three screenshots into `visual-qa/` (wide, close, mobile), an honest critique in `VISUAL_QA.md`, and I show you before the next room.

## Cuts
Field Notes, Data Playground, Research Laboratory, Methodology Wall: not built (no content). The v11 KURENAI motion layer, Lenis, the skills graph and the experience card stack are dropped on this branch (they stay on `v11-kurenai`).

## Decisions needed from you
1. **Skill logos:** none exist. Supply files, or allow the CC0 `simple-icons` set (original brand colours) with monograms for the rest, or all monograms.
2. **Contact form:** none exists on the live site. Add one (needs a Formspree or Web3Forms account), or keep the existing email / links only.
3. **Fonts:** the Bryl Lim reference is not in the repo and I cannot read a site you have not named. Send the URL, or I use Geist Mono + Geist Sans.
4. **Interactive extras from `main`** (trait mixer, AURA pipeline, physics sandbox): drop, or place the first two in the Inspect panel.
5. **Scale of the first checkpoint:** I will build Projects first and stop for your review with screenshots, as the gates require.
