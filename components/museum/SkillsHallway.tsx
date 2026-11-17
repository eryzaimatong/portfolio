"use client";
import { useMemo } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { skillGroups } from "@/data/skills";
import logos from "@/data/logos.json";
import { SKILLS } from "@/lib/rooms";
import { usePBR } from "./Materials";
import { Floor, Slit } from "./parts";
import { Wall } from "./shell";

const { z0, z1, w, h } = SKILLS;
const WALL_TINT = "#d6cfbe";                // honed pale plaster / limestone, a deliberate change from the dark rooms
const WALL_RGB = [0xd6, 0xcf, 0xbe];
const MONO = "/fonts/geist-mono-500.woff";
const COLS = 5, PITCH = 0.74, SIZE = 0.48;
type Logo = { path: string; hex: string; title: string };
const LOGOS = logos as Record<string, Logo>;

const lum = (r: number, g: number, b: number) => { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const contrast = (hex: string) => { const n = parseInt(hex, 16); const a = lum(n >> 16, (n >> 8) & 255, n & 255) + 0.05, b = lum(WALL_RGB[0], WALL_RGB[1], WALL_RGB[2]) + 0.05; return Math.max(a, b) / Math.min(a, b); };

/* The real simple-icons path, in the brand's original colour. A logo that would not read against the wall sits on a small flush graphite inlay (no frame, no glow). */
function makeTexture(l: Logo) {
  const c = document.createElement("canvas"); c.width = c.height = 512;
  const g = c.getContext("2d")!;
  const inlay = contrast(l.hex) < 3;
  if (inlay) { g.fillStyle = "#2b2a27"; g.fillRect(0, 0, 512, 512); }
  const s = inlay ? 0.62 : 0.86, off = (512 - 512 * s) / 2;
  g.translate(off, off); g.scale((512 * s) / 24, (512 * s) / 24);
  g.fillStyle = "#" + l.hex; g.fill(new Path2D(l.path));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  return { tex: t, inlay };
}

function WallLogo({ name, pos, rotY }: { name: string; pos: [number, number, number]; rotY: number }) {
  const pbr = usePBR("plastered_wall", [0.15, 0.15]);
  const logo = LOGOS[name];
  const made = useMemo(() => (logo ? makeTexture(logo) : null), [logo]);
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {made ? (
        <mesh receiveShadow aria-label={name}>
          <planeGeometry args={[SIZE, SIZE]} />
          <meshStandardMaterial map={made.tex} normalMap={pbr.normalMap} roughnessMap={pbr.roughnessMap} normalScale={new THREE.Vector2(0.5, 0.5)} roughness={0.9} metalness={0} transparent alphaTest={0.02} envMapIntensity={0.5} />
        </mesh>
      ) : (
        /* no logo file for this technology: a restrained typographic mark, never a redrawn brand */
        <Text font={MONO} fontSize={0.066} maxWidth={SIZE * 1.15} lineHeight={1.15} color="#2a2824" anchorX="center" anchorY="middle" textAlign="center" position={[0, 0, 0.002]}>{name}</Text>
      )}
      {made && <Text font={MONO} fontSize={0.04} maxWidth={0.58} color="#3a3731" anchorX="center" anchorY="top" position={[0, -SIZE / 2 - 0.05, 0.002]}>{name}</Text>}
    </group>
  );
}

export function SkillsHallway() {
  const len = Math.abs(z1 - z0), cz = (z0 + z1) / 2;
  // alternate categories between the two walls; each block is 5 columns wide
  const blocks = useMemo(() => {
    const out: { g: (typeof skillGroups)[number]; side: -1 | 1; zStart: number }[] = [];
    let l = z0 - 2.0, r = z0 - 5.6;                                       // next free south edge on the left / right wall
    skillGroups.forEach((g, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const span = COLS * PITCH + 0.9;
      if (side === -1) { out.push({ g, side, zStart: l }); l -= span; } else { out.push({ g, side, zStart: r }); r -= span; }
    });
    return out;
  }, []);
  return (
    <group>
      <Floor w={w} l={len} position={[0, 0, cz]} tint="#cfcabd" />
      <Wall w={w} h={len} position={[0, h, cz]} rotation={[Math.PI / 2, 0, 0]} tint="#8a867d" />
      <Wall w={len} h={h} position={[-w / 2, h / 2, cz]} rotation={[0, Math.PI / 2, 0]} tint={WALL_TINT} />
      <Wall w={len} h={h} position={[w / 2, h / 2, cz]} rotation={[0, -Math.PI / 2, 0]} tint={WALL_TINT} />
      {/* wall-washer light slits near each wall, plus a centre slit */}
      <Slit position={[-w / 2 + 0.45, h - 0.02, cz]} size={[0.14, len - 2]} intensity={34} color="#fff0d8" centreZ={cz} reach={20} />
      <Slit position={[w / 2 - 0.45, h - 0.02, cz]} size={[0.14, len - 2]} intensity={34} color="#fff0d8" centreZ={cz} reach={20} />
      <Slit position={[0, h - 0.02, cz]} size={[0.14, len - 2]} intensity={14} color="#ffe6c4" centreZ={cz} reach={20} />
      {blocks.map(({ g, side, zStart }) => {
        const x = side * (w / 2 - 0.006), rotY = side === -1 ? Math.PI / 2 : -Math.PI / 2;
        // reading direction along the wall: the left wall runs toward -z, the right wall toward +z
        const zNorth = zStart - (COLS - 1) * PITCH;
        const zTitle = side === -1 ? zStart + PITCH / 2 : zNorth - PITCH / 2;
        return (
          <group key={g.id}>
            {/* category title in the display mono, set directly on the wall */}
            <Text font={MONO} fontSize={0.17} lineHeight={1.1} maxWidth={COLS * PITCH + 0.2} color="#2a2824" anchorX="left" anchorY="middle" position={[x, 3.2, zTitle]} rotation={[0, rotY, 0]}>{g.name}</Text>
            {g.skills.map((sk, i) => {
              const col = i % COLS, row = Math.floor(i / COLS);
              const z = side === -1 ? zStart - col * PITCH : zNorth + col * PITCH;
              return <WallLogo key={sk.name} name={sk.name} pos={[x, 2.25 - row * 1.02, z]} rotY={rotY} />;
            })}
          </group>
        );
      })}
    </group>
  );
}
