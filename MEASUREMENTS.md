# MEASUREMENTS

Machine: Windows 11 laptop, **Intel UHD Graphics (integrated)**, Chrome (headless, hardware ANGLE/D3D11), production build (`next build` + `next start`), 3 s of requestAnimationFrame per room, scrolled to a mid-room position. Scripts are in the session scratchpad, not the repo. This is one integrated GPU: it is a floor, not a typical gaming or desktop GPU, and not a phone.

## Frame rate (fps, worst single frame ms in brackets)
| Room | High, 1440x900 | Balanced, 1440x900 | Balanced, 390x844 (mobile viewport) |
|---|---|---|---|
| Home | 26 (50) | 48 (34) | 60 (17) |
| About | 25 (50) | 46 (50) | 61 (17) |
| Projects | 20 (100) | 48 (34) | 60 (17) |
| Skills | 25 (67) | 56 (34) | 60 (17) |
| Experience | 24 (50) | 49 (34) | 61 (17) |
| Leadership | 15 (100) | 45 (34) | 60 (17) |
| Contact | 26 (50) | 57 (34) | 60 (17) |

- **High is not smooth on integrated graphics (15 to 26 fps).** It is meant for discrete GPUs, which I could not test. Automatic tier selection now never picks High on Intel integrated graphics (Arc excepted); it picks Balanced, which holds 45 to 60 fps here.
- The mobile row is a phone-sized viewport on this laptop GPU, **not a real phone**.

## Before and after the lighting refactor (High, 1440x900)
| | Before | After |
|---|---|---|
| Real lights alive at once | up to about 12 area + several spots | 6 area lights + 1 shadow spot + hemisphere, fixed for the whole walk |
| Frame rate | 8 to 16 fps | 15 to 26 fps |
| Time until the first frame (shader compile) | about 180 s | about 20 to 23 s |
| Balanced time until first frame | n/a | 10 to 16 s |

Cause: every room owned its own lights, and any change in light count recompiled every material. Rooms now register "anchors"; a small fixed pool of real lights moves to the nearest ones (`lib/lights.ts`, `components/museum/LightPool.tsx`). Also: floor reflection 1024 to 512, N8AO to performance quality, chromatic aberration removed.

## Load and size (production)
- JS: 947 KB gzip in total across all chunks; the 3D scene is one lazy chunk of about 616 KB gzip, loaded after first paint.
- 3D assets: textures 8 MB, HDRI 1.6 MB, fonts 120 KB, plus the project images (public/assets 2.7 MB).
- About 6.3 MB transferred before the first 3D frame on a local server. **Not measured on a real network.**

## Lighthouse (mobile emulation, simulated throttling, local production server)
| Page | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| Lite layout (`?tier=lite`) | 86 | 96 (fixed since: low-contrast footer controls) | 100 | 100 |
| 3D (default tier) | 50 | 100 | 100 | 100 |

The 3D page scores about 50 on Performance because of long main-thread tasks (3D setup and shader compile) under 4x CPU throttling. LCP 3.6 s. This is expected for a WebGL scene; the Lite layout meets the 85+ target. The default tier here went to 3D because the headless Chrome has a real GPU.

## Quality gates (section 2.8), after this pass
| Gate | Result |
|---|---|
| 1 Material audit | **Pass.** 431 meshes, 431 materials, 0 failures (glass, emissive fixtures, beam shader and SDF text are exempt). |
| 2 Light audit | Pass. Every room is lit by the shared pool: 6 area lights + 1 shadow-casting spot, plus HDRI and a cool hemisphere fill. |
| 3 Reflection test | Pass, modestly (High tier only). |
| 4 Glass test | **Pass on High.** Cisco cube shows refraction of the room, edge highlights and the logo inside (`visual-qa/d1440-leadership.jpg`). |
| 5 Texture check | No stretching; 1k and 2k JPG, not KTX2. |
| 6 Banned-look scan | None found. |
| 7 Screenshot proof | `visual-qa/d1440-*` (High), `b1440-*` (Balanced), `m390-*` (mobile viewport) for all seven rooms. |
| 8 Honesty | Frame rate is from one integrated GPU; nothing was measured on a phone or a discrete GPU. |

## Still to do
- Test on a discrete GPU and a real phone.
- KTX2 compression, Re:Watch trait mixer and AURA explainer in the Inspect panel, camera move-in on a clicked cube.
- Close-up screenshots (the rooms are shot at their resting view only).
