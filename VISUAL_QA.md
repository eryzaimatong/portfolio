# VISUAL QA

Environment: Chrome in the Claude desktop browser pane, Next dev server, `?tier=high`. Judged from screenshots only; the pane's GPU and frame rate are unknown, so **no performance claim is made**.

## Checkpoint 2: realism pass (Home hall + Projects room)

Screenshots in `visual-qa/`: `home-wide.jpg`, `projects-wide.jpg`, `projects-close.jpg`, `projects-mobile.jpg` (mobile is from checkpoint 1, taken after the camera fix and before the texture swap, so it still shows the old brown walls; **needs a re-shoot**).

### What changed since checkpoint 1
| Problem found | Fix | Result |
|---|---|---|
| Walls looked stained and grimy (`concrete_wall_003`) | Fine plaster (`plastered_wall`) for walls, board-formed concrete (`concrete_layers_02`) for the column and door reveals | **Fixed.** Clean, calm, architectural. |
| Dirty brown floor (`concrete_floor_02`) | `concrete_floor_worn_001`, lighter tint | Fixed. |
| Floor reflection absent | Real reflector with crisper blur, lighter floor, stronger slit lights | **Now visible:** the lit frame, plaque and screen reflect in the floor with blur. Slightly stepped at the far edge. |
| Colour almost all warm brown | Cool 6000K hemisphere fill against the warm 3200K spots, higher environment | Better: walls read neutral grey-green, warm light stays on the artwork and floor pool. Cool fill is still subtle. |
| Frame looked like a freestanding lightbox | Steps forward 0.3 (was 0.85) and scales 1.035 | Reads as hung. (The brief's "about 0.85 units" was too much at this room scale.) |
| Ceiling slits were flat cream rectangles | Recessed dark cove around each slit, dimmer emissive fixture | Better; still a little flat. |
| No wall thickness, no skirting gap | Door reveals (jambs + soffit), dark skirting shadow gap | Added. Visible at the doorways. |
| Beam faint after the wall change | Beam opacity .22 to .4 | Visible again with dust. |
| Mobile: work off-screen | Camera turns fully to the work on portrait screens | Fixed (checkpoint 1 shot). |
| Textures took about 30 s to finish loading in dev | Plaster and concrete back to 1k; unused sets removed (8 MB left) | Should be much lighter; **load time not re-measured**. |

### Gate results
| Gate | Result |
|---|---|
| 1 Material audit | Run in page: 87 meshes / 87 materials. Remaining non-PBR hits are troika SDF **text glyph meshes** (plaque text; exempt) and ceiling fixture planes flagged `fixture` (emissive; exempt). The reflective floors lacked a roughness map in the first run of this pass; roughness map restored afterwards. **Re-run after that last change is not yet pasted.** |
| 2 Light audit | Home: 3 ceiling-slit RectAreaLights + corridor slit + 1 shadow-casting SpotLight + HDRI + hemisphere fill. Projects: 2 slit RectAreaLights + antechamber slit + 1 shadow-casting SpotLight (sliding exhibit light) + HDRI + hemisphere fill. Passes. |
| 3 Reflection test | **Passes, modestly.** Blurred reflection of the lit frame and plaque visible in `projects-close.jpg`. |
| 4 Glass test | N/A until the Leadership room exists. |
| 5 Texture check | No visible stretching at resting views; plaster tiling not obvious. 1k JPG, not KTX2. |
| 6 Banned-look scan | No neon, flare, glow outlines, blurry baked text or flat grey walls. The room is darker and sparser than a real museum photograph. |
| 7 Screenshot proof | Wide + close for both rooms; mobile needs a re-shoot. |
| 8 Honesty | Stated below. |

### Honest critique: what still looks fake
1. **Too dark overall, with a black void in the lower third.** The floor is glossy dark; only the spot pool and the reflection lift it. A real gallery photograph would show more soft ambient bounce on the walls.
2. **The reflection is blurry and slightly stepped** (low-resolution reflector plus the normal map), not a clean mirror-polish.
3. **Only two works** hang on a large round room, so it feels empty; the sliding-spotlight idea has little to slide between.
4. **No ceiling cove or coffer detail**, and the corridor and antechamber are still plain boxes.
5. **The beam is a cone**, not a noisy raymarched volume, so it can look flat from some angles.
6. **Perfect geometry**: no scuffs, dust on the floor or panel seams (the brief asks for subtle imperfection).
7. **Performance is unmeasured.**

### Not built yet
About, Skills, Experience, Leadership and Contact in 3D (they exist in Lite with identical content); the Re:Watch trait mixer and AURA pipeline explainer in the Inspect panel; KTX2; a production-build timing.

## Checkpoint 1 (superseded)
Brown stained walls, no visible floor reflection, frame stepping 0.85. Kept only for the mobile shot.

---

## Checkpoint 3: all seven rooms in 3D

Screenshots in `visual-qa/`: `about-wide`, `skills-wide`, `experience-wide`, `leadership-wide`, `contact-wide` (all `?tier=balanced`, desktop pane, shot once each). **Close and mobile views for these five rooms are not captured**, so gate 7 is only partly met. Material audit re-run on Leadership + Contact: 113 meshes, the only misses were the logo emblem planes, which now carry a normal + roughness grain (not re-audited after the fix). High tier (planar reflections + transmission glass) was only viewed in Home and Projects; About through Contact were reviewed in Balanced.

| Room | What exists | Honest critique |
|---|---|---|
| About | Portrait (`eryza.png`) in an oak frame beside the doorway, warming from grey to colour; heading, lead and the six profile fields; the four existing bio sentences as separate wall labels | Text is small until you are close. The warming is real but subtle in a still. Walls are plain; only one portrait. |
| Skills | Narrow pale-plaster hallway, wall-washer slits, real simple-icons logos in original colours grouped by the seven live categories, large category titles, names under each logo; light logos sit on a flush graphite inlay | Logos read, but at the wide view they are still smallish; the far end opens into a black void until the next room lights. 22 of 41 technologies have a logo; the rest are typographic marks (see CONTENT_TODO). Right-wall text reads away from the walking direction. |
| Experience | Flat entry wall, half-round room, three lit niches: School (PUP seal), Scholarship + programme (DOST-SEI, GCI logos), Credentials (the three real certificates); click or "Details" opens an HTML panel | Alcoves are dim and the type is small. A fourth bay was left out (no content). Asymmetric layout. |
| Leadership | Three floating glass cubes (Cisco NetConnect, IBITS, GDG on Campus PUP) with laminated logo emblems that sway, one sliding spotlight, floor pool | Cube edges are heavy dark lines; the emblem is a laminated PNG (not a true extrusion). Transmission glass not verified on High. |
| Contact | Calm room opening onto a lit doorway whose light spills across the floor; contact card with email, GitHub, LinkedIn, copy address | Best-looking room. Doorway reads as a bright box rather than a space. |

### Real problems found
1. **First entry into each room stalled for roughly 15 to 25 seconds in this environment** (the screen goes black while shaders compile for that room's light count). Mitigation added: a "Preparing the museum" veil that compiles every room up front (capped at 20 s so it can never stick). Verified the veil clears; I did **not** verify the stall is gone on a real GPU.
2. **Frame rate is unmeasured.** Up to about 12 lights and several reflectors can be live at once.
3. A hidden or backgrounded tab can never finish `compileAsync`; the cap handles that.
4. The pane's screenshots alternate between a real frame and a black one; every shot above is a real frame.
5. Wall text is SDF text in the scene, with the same words in the hidden Lite layout for screen readers; the brief's "HTML on hover" for the About labels is not done.
6. Not done from the brief: the camera does not move in on a clicked cube (it opens the panel), the Re:Watch trait mixer and AURA explainer are not in the Inspect panel, no KTX2.
