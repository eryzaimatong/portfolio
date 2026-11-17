"use client";
import { useMemo } from "react";
import * as THREE from "three";
import { Text, useTexture } from "@react-three/drei";
import { experience, credentials } from "@/data/profile";
import { EXP } from "@/lib/rooms";
import { Floor, Slit } from "./parts";
import { WallMaterial, usePBR } from "./Materials";
import { DoorWall } from "./shell";
import { Frame } from "./frame";
import { S, set, useStore } from "@/lib/store";

const { zc, r, h, door } = EXP;
const SANS = "/fonts/geist-sans-400.woff", SANS_B = "/fonts/geist-sans-600.woff", MONO = "/fonts/geist-mono-500.woff";
const NICHE_W = 2.2, NICHE_H = 3.2, NICHE_D = 0.75;
/* angle (degrees) of each alcove from straight ahead, positive toward +x. A fourth bay at +62 is left out: no content for it. */
export const EXP_ANGLES = [-62, -28, 28];
const DOOR_GAP = Math.asin(door / 2 / r), NICHE_GAP = Math.asin(NICHE_W / 2 / r);

const pointer = { onPointerOver: () => (document.body.style.cursor = "pointer"), onPointerOut: () => (document.body.style.cursor = "") };

/* wall segments of the back half-circle, leaving gaps for the three alcoves and the exit doorway */
function useArcs() {
  return useMemo(() => {
    const gaps = [...EXP_ANGLES.map((a) => ({ c: Math.PI - (a * Math.PI) / 180, hw: NICHE_GAP })), { c: Math.PI, hw: DOOR_GAP }].sort((a, b) => a.c - b.c);
    const out: [number, number][] = []; let cur = Math.PI / 2;
    for (const g of gaps) { if (g.c - g.hw > cur + 0.001) out.push([cur, g.c - g.hw - cur]); cur = g.c + g.hw; }
    if (3 * Math.PI / 2 > cur + 0.001) out.push([cur, 3 * Math.PI / 2 - cur]);
    return out;
  }, []);
}

type ItemProps = { x: number; img: string; iw: number; ih: number; date: string; title: string; org?: string; width: number; onClick: () => void; label: string; size?: number };
function Item({ x, img, iw, ih, date, title, org, width, onClick, label, size = 0.098 }: ItemProps) {
  const tex = useTexture(img);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 16;
  const grain = usePBR("oak_veneer_01", [1, 1]);      // a faint print grain, so the picture is a PBR surface
  return (
    <group position={[x, 0, -NICHE_D + 0.02]}>
      <Frame aw={iw} ah={ih} position={[0, 2.0, 0]}>
        <mesh onClick={(e) => { e.stopPropagation(); onClick(); }} {...pointer} userData={{ label }}>
          <planeGeometry args={[iw, ih]} /><meshStandardMaterial map={tex} normalMap={grain.normalMap} roughnessMap={grain.roughnessMap} normalScale={new THREE.Vector2(0.02, 0.02)} roughness={0.7} metalness={0} />
        </mesh>
      </Frame>
      <Text font={MONO} fontSize={0.056} color="#C3A979" maxWidth={width} anchorX="center" anchorY="top" position={[0, 1.18, 0.01]} textAlign="center">{date.toUpperCase()}</Text>
      <Text font={SANS_B} fontSize={size} lineHeight={1.12} color="#EDE6D6" maxWidth={width} anchorX="center" anchorY="top" position={[0, 1.1, 0.01]} textAlign="center">{title}</Text>
      {org && <Text font={SANS} fontSize={0.062} lineHeight={1.2} color="#A8A294" maxWidth={width} anchorX="center" anchorY="top" position={[0, 0.62, 0.01]} textAlign="center">{org}</Text>}
    </group>
  );
}

/* One lit alcove: a deep niche in the wall with its own concealed light. Local +z points to the room's centre. */
function Alcove({ ax, index, children }: { ax: number; index: number; children: React.ReactNode }) {
  const th = Math.PI - (ax * Math.PI) / 180;
  const pos: [number, number, number] = [r * Math.sin(th), 0, zc + r * Math.cos(th)];
  const sel = useStore((s) => s.expSel === index);
  return (
    <group position={pos} rotation={[0, th + Math.PI, 0]}>
      {/* niche returns */}
      <mesh position={[0, NICHE_H / 2, -NICHE_D]} receiveShadow><planeGeometry args={[NICHE_W, NICHE_H]} /><WallMaterial repeat={[1, 1.4]} tint="#8f8b82" /></mesh>
      {[-1, 1].map((s) => (<mesh key={s} position={[s * NICHE_W / 2, NICHE_H / 2, -NICHE_D / 2]} rotation={[0, -s * Math.PI / 2, 0]}><planeGeometry args={[NICHE_D, NICHE_H]} /><WallMaterial repeat={[0.4, 1.4]} tint="#5f5c56" /></mesh>))}
      <mesh position={[0, NICHE_H, -NICHE_D / 2]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[NICHE_W, NICHE_D]} /><WallMaterial repeat={[1, 0.4]} tint="#4a4843" /></mesh>
      <mesh position={[0, 0.004, -NICHE_D / 2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[NICHE_W, NICHE_D]} /><WallMaterial repeat={[1, 0.4]} tint="#8a867e" /></mesh>
      {/* concealed light along the niche's top edge */}
      <Slit position={[0, NICHE_H - 0.01, -NICHE_D / 2 - 0.05]} size={[NICHE_W - 0.3, 0.12]} intensity={sel ? 120 : 85} color="#ffd9a8" centreZ={zc - r * 0.5} reach={30} />
      {children}
    </group>
  );
}

/* Experience: a semicircular room, a flat entry wall with the hallway doorway, a doorway straight ahead, and three lit alcoves. */
export function ExperienceRoom() {
  const arcs = useArcs();
  const it = experience.items;
  const open = (kind: "exp" | "cert", index: number) => () => set({ panel: { kind, index } });
  return (
    <group>
      <Floor w={r * 2} l={r} half position={[0, 0, zc]} />
      <DoorWall z={zc} w={r * 2} h={h} dir={-1} />
      {arcs.map(([start, len]) => (
        <mesh key={start} position={[0, h / 2, zc]} receiveShadow castShadow>
          <cylinderGeometry args={[r, r, h, 64, 1, true, start, len]} />
          <WallMaterial repeat={[(r * len) / 2.4, h / 2.4]} side={THREE.BackSide} />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, zc]}><circleGeometry args={[r, 64, Math.PI, Math.PI]} /><WallMaterial repeat={[3, 3]} tint="#4a4843" /></mesh>
      <Slit position={[0, h - 0.02, zc - 3]} size={[0.2, 5]} intensity={14} centreZ={zc - 3} reach={14} />
      {/* 1. School */}
      <Alcove ax={EXP_ANGLES[0]} index={0}>
        <Item x={0} img={it[0].badge!.src} iw={0.95} ih={0.95} date={it[0].date} title={it[0].title} org={it[0].org} width={2.0} onClick={open("exp", 0)} label={it[0].title} />
      </Alcove>
      {/* 2. Scholarship and programme */}
      <Alcove ax={EXP_ANGLES[1]} index={1}>
        <Item x={-0.52} img={it[1].badge!.src} iw={0.55} ih={0.55} date={it[1].date} title={it[1].title} org={it[1].org} width={1.0} size={0.075} onClick={open("exp", 1)} label={it[1].title} />
        <Item x={0.58} img={it[2].badge!.src} iw={0.8} ih={0.125} date={it[2].date} title={it[2].title} org={it[2].org} width={1.0} size={0.062} onClick={open("exp", 2)} label={it[2].title} />
      </Alcove>
      {/* 3. Credentials: the three real certificates */}
      <Alcove ax={EXP_ANGLES[2]} index={2}>
        {credentials.items.map((c, i) => (
          <Item key={c.title} x={(i - 1) * 0.72} img={c.cert!.src} iw={0.5} ih={i === 1 ? 0.34 : 0.29} date={c.date.split(" · ")[1] ?? c.date} title={c.title} width={0.68} size={0.05} onClick={open("cert", i)} label={c.title} />
        ))}
      </Alcove>
    </group>
  );
}

export const _expKeep = { S };
