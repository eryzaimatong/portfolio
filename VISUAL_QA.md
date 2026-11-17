# VISUAL QA: checkpoint 1 (Home hall + Projects room)

Environment: Chrome in the Claude desktop browser pane, dev server, `?tier=high`. Screenshots are cropped by the pane to about 800 px wide, and the pane's GPU and frame rate are unknown. Everything below is judged from screenshots only.

Screenshots (`visual-qa/`): `home-wide.jpg`, `projects-rewatch-wide.jpg`, `projects-aura-wide.jpg`, `projects-mobile.jpg`. A "close" view per room is **not yet captured**; gate 7 is only partly met.

## Gate results
| Gate | Result |
|---|---|
| 1 Material audit | Ran in the page (`window.__scene` walk). 48 meshes / 48 materials. After the fix: the two artwork prints now carry a normal + roughness map. The 4 remaining `MeshBasicMaterial` hits are troika SDF **text glyph meshes** (plaque text), which are exempt text, not surfaces. Ceiling slit fixtures are flagged `fixture` (emissive). Re-run not yet pasted after the fix. |
| 2 Light audit | Home: 3 ceiling-slit RectAreaLights + 1 corridor slit + 1 shadow-casting SpotLight (back wall) + dim HDRI. Projects: 2 slit RectAreaLights + antechamber slit + 1 shadow-casting SpotLight (the sliding exhibit light) + HDRI. Passes. |
| 3 Reflection test | **Weak.** `MeshReflectorMaterial` is on the floors, but in the screenshots the floor reads as dark matte concrete with only a faint sheen under the lit frame. I cannot say the frames are "visibly reflected with blur". Needs tuning (lower roughness, stronger mirror, a lighter floor). |
| 4 Glass test | Not applicable yet (Leadership room not built). |
| 5 Texture check | 1k JPG, 3 tiled sets. No obvious stretching. Repetition is not obvious at the resting views but the wall texture itself reads stained. Not KTX2-compressed (no `toktx` here). |
| 6 Banned-look scan | See critique. No neon, flare or glow outlines. A **muddy brown cast and grimy walls** is the main failure. |
| 7 Screenshot proof | Wide + mobile captured; close views missing. |
| 8 Honesty | See below. |

## Critique against section 2 (what still looks fake)
**Works:** real 3D architecture connected by a doorway and corridor; PBR concrete with visible grain and shadowed column; warm spotlight with a soft penumbra, a visible beam and drifting dust; framed work with mat, slim oak frame, plaque with catalogue number, name and year; the selected work steps forward and the light slides to it; layout and text stay crisp HTML.

**Still fake or weak:**
1. **The walls look dirty, not refined.** The Poly Haven "Concrete Wall 003" is a stained, weathered concrete. Under warm light it turns brown and mottled, like a basement. A cleaner honed plaster or board-formed concrete is needed; this is the biggest realism problem.
2. **Floor reflections are not convincing** (gate 3).
3. **Colour is almost monochrome warm brown.** The brief wants a warm key against a cooler fill; the cool fill is too weak to read.
4. **The stepped-forward frame looks like a freestanding lightbox.** At 0.85 units forward and 1.06 scale, with a dark gap behind it, it stops reading as hung on the wall.
5. **Ceiling slit fixtures read as flat cream rectangles** in the corridor and antechamber.
6. **Walls are thin planes with no thickness**, so doorways have no reveal depth; no skirting shadow gap, no ceiling cove, no panel seams yet.
7. **Only two works** hang on the wall, so the room is sparse.
8. **Performance is unmeasured.** First load of the 3D scene took roughly 8 to 10 seconds in the dev server on this machine, before any optimisation, and I cannot measure frame rate here.

## Fixed this pass
- Mobile: the camera now turns fully to the selected work on portrait screens (before: the work was off-screen).
- Artwork prints are now PBR surfaces for gate 1.
- Spotlight colour made less orange, wall tint made slightly cooler.

## Not built yet
About, Skills, Experience, Leadership and Contact in 3D (they exist in the Lite layout, same content); Inspect-panel explainers (trait mixer, AURA pipeline); a "close" screenshot per room; KTX2 compression; production-build performance check.
