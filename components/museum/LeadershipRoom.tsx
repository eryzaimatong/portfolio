"use client";
import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SpotLight, Text, useTexture } from "@react-three/drei";
import { leadership } from "@/data/profile";
import { LEAD } from "@/lib/rooms";
import { OakMaterial, usePBR } from "./Materials";
import { roomGain } from "./parts";
import { RoundShell } from "./round";
import { S, set, useStore } from "@/lib/store";

const { zc, r, h, door } = LEAD;
const MONO = "/fonts/geist-mono-500.woff", SANS_B = "/fonts/geist-sans-600.woff";
/* a loose arc, kept clear of the straight line the camera walks along; heights differ a little */
export const LEAD_CUBES = [
  { ax: -48, rad: 4.4, y: 1.85 },
  { ax: -20, rad: 5.2, y: 1.5 },
  { ax: 40, rad: 4.6, y: 1.95 },
];
const S_CUBE = 0.9;
export const cubePos = (i: number): [number, number, number] => {
  const c = LEAD_CUBES[i], a = (c.ax * Math.PI) / 180;
  return [c.rad * Math.sin(a), c.y, zc - c.rad * Math.cos(a)];
};

/* An emblem built from the organization's real logo file: a coloured face with a brass laminated edge, so it has real depth when it turns. */
function Emblem({ src, tilt }: { src: string; tilt: React.MutableRefObject<number> }) {
  const tex = useTexture(src);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 16;
  const g = useRef<THREE.Group>(null);
  const grain = usePBR("oak_veneer_01", [1, 1]);     // a fine brushed grain so the emblem is a full PBR surface
  useFrame(({ clock }) => {
    if (!g.current) return;
    if (document.documentElement.dataset.motion === "calm") { g.current.rotation.y = 0; return; }
    g.current.rotation.y = Math.sin(clock.elapsedTime * 0.5) * 0.7 + tilt.current;
  });
  const layers = [0.006, 0.012, 0.018, 0.024, 0.03];
  return (
    <group ref={g}>
      <mesh position={[0, 0, 0.034]} castShadow>
        <planeGeometry args={[0.52, 0.52]} />
        <meshStandardMaterial map={tex} normalMap={grain.normalMap} roughnessMap={grain.roughnessMap} normalScale={new THREE.Vector2(0.15, 0.15)} alphaTest={0.5} roughness={0.5} metalness={0.15} envMapIntensity={1.2} side={THREE.DoubleSide} />
      </mesh>
      {layers.map((z) => (
        <mesh key={z} position={[0, 0, z]}>
          <planeGeometry args={[0.52, 0.52]} />
          <meshStandardMaterial map={tex} alphaMap={tex} normalMap={grain.normalMap} roughnessMap={grain.roughnessMap} normalScale={new THREE.Vector2(0.15, 0.15)} color="#b8985f" alphaTest={0.5} roughness={0.45} metalness={0.9} envMapIntensity={1.6} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function Cube({ index }: { index: number }) {
  const it = leadership.items[index];
  const tier = useStore((s) => s.tier);
  const sel = useStore((s) => s.leadSel === index);
  const pos = cubePos(index);
  const grp = useRef<THREE.Group>(null);
  const tilt = useRef(0);
  const hover = useRef(false);
  useFrame(({ clock }, dt) => {
    if (!grp.current) return;
    const calm = document.documentElement.dataset.motion === "calm";
    grp.current.position.y = pos[1] + (calm ? 0 : Math.sin(clock.elapsedTime * 0.6 + index * 2) * 0.05);   // slow sway
    const want = (hover.current ? 0.12 : 0) + (sel ? 0.04 : 0);
    tilt.current += (want - tilt.current) * Math.min(1, dt * 4);
    grp.current.rotation.z = tilt.current * 0.5;
    grp.current.rotation.x = tilt.current * 0.4;
  });
  const high = tier === "high";
  const half = S_CUBE / 2, e = 0.014;
  const edges: [number, number, number, number, number, number][] = [];
  for (const sy of [-1, 1]) for (const sz of [-1, 1]) edges.push([0, sy * half, sz * half, S_CUBE, e, e]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) edges.push([sx * half, 0, sz * half, e, S_CUBE, e]);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) edges.push([sx * half, sy * half, 0, e, e, S_CUBE]);
  return (
    <group position={[pos[0], 0, pos[2]]}>
      <group ref={grp} position={[0, pos[1], 0]}
        onPointerOver={() => { hover.current = true; document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { hover.current = false; document.body.style.cursor = ""; }}
        onClick={(e) => { e.stopPropagation(); if (S.leadSel !== index) set({ leadSel: index }); else set({ panel: { kind: "org", index } }); }}>
        {/* glass: transmission, thickness, IOR 1.5, a hint of attenuation and dispersion on High; cheaper reflective glass otherwise */}
        <mesh castShadow={false}>
          <boxGeometry args={[S_CUBE, S_CUBE, S_CUBE]} />
          {high ? (
            <meshPhysicalMaterial transmission={1} thickness={0.4} ior={1.5} roughness={0.04} attenuationColor="#cfe2dc" attenuationDistance={2.2} clearcoat={1} clearcoatRoughness={0.05} dispersion={0.15} envMapIntensity={1.6} color="#ffffff" specularIntensity={1} />
          ) : (
            <meshPhysicalMaterial transparent opacity={0.16} roughness={0.04} metalness={0} clearcoat={1} envMapIntensity={2.2} color="#dfeee8" side={THREE.DoubleSide} />
          )}
        </mesh>
        {edges.map(([x, y, z, a, b, c], i) => (<mesh key={i} position={[x, y, z]}><boxGeometry args={[a, b, c]} /><OakMaterial tint="#15130f" /></mesh>))}
        <Emblem src={it.badge!.src} tilt={tilt} />
      </group>
      <Text font={SANS_B} fontSize={0.075} maxWidth={1.5} lineHeight={1.15} color="#EDE6D6" fillOpacity={sel ? 1 : 0.55} anchorX="center" anchorY="top" textAlign="center" position={[0, 1.15, 0]} rotation={[0, 0, 0]}>
        {it.date.split(" · ")[0]}
      </Text>
    </group>
  );
}

/* A single shadow-casting spot that follows the selection, plus a soft fixed light on each cube so all three are lit. */
function Lights() {
  const moving = useRef<THREE.SpotLight>(null);
  const cur = useRef(new THREE.Vector3(...cubePos(0)));
  useFrame(({ camera }, dt) => {
    const t = cubePos(S.leadSel), k = Math.min(1, dt * 4);
    cur.current.x += (t[0] - cur.current.x) * k; cur.current.z += (t[2] - cur.current.z) * k;
    const l = moving.current;
    if (l) {
      l.position.set(cur.current.x * 0.9, h - 0.3, zc + (cur.current.z - zc) * 0.9);
      l.target.position.set(cur.current.x, 1.5, cur.current.z); l.target.updateMatrixWorld();
      l.intensity = 420 * S.lights * roomGain(camera.position.z, zc, 12);
    }
  });
  return (
    <>
      <SpotLight ref={moving as any} castShadow color="#ffe2bd" angle={0.3} penumbra={1} distance={13} decay={2} attenuation={6} anglePower={4} opacity={0.3} radiusTop={0.1} radiusBottom={1.2} shadow-mapSize={[1024, 1024]} shadow-radius={6} shadow-bias={-0.0004} />
      {LEAD_CUBES.map((_, i) => {
        const p = cubePos(i);
        return <pointLight key={i} position={[p[0], p[1] + 1.4, p[2] + 0.4]} intensity={7} distance={5} decay={2} color="#ffdcae" />;
      })}
    </>
  );
}

/* Leadership: three glass cubes hang in the air, each holding an organization's real logo. */
export function LeadershipRoom() {
  return (
    <RoundShell zc={zc} r={r} h={h} door={door}>
      <Lights />
      {LEAD_CUBES.map((_, i) => (<Cube key={i} index={i} />))}
    </RoundShell>
  );
}
