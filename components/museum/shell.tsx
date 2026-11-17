"use client";
import { useEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { CORR } from "@/lib/rooms";
import { WallMaterial, ConcreteMaterial } from "./Materials";
import { Floor, Slit, tile } from "./parts";

export function Wall({ w, h, position, rotation = [0, 0, 0] as [number, number, number], tint, concrete }: { w: number; h: number; position: [number, number, number]; rotation?: [number, number, number]; tint?: string; concrete?: boolean }) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow castShadow>
      <planeGeometry args={[w, h]} />
      {concrete ? <ConcreteMaterial repeat={tile(w, h)} tint={tint} /> : <WallMaterial repeat={tile(w, h)} tint={tint} />}
    </mesh>
  );
}

/* Only draws a room while the camera is near it (cheaper, and keeps the number of live lights and reflections low). */
const gates = new Set<{ ref: React.RefObject<THREE.Group | null>; centre: number; range: number }>();
export function applyGates(z: number) { gates.forEach((g) => { if (g.ref.current) g.ref.current.visible = Math.abs(z - g.centre) < g.range; }); }
export function RoomGate({ centre, range = 46, children }: { centre: number; range?: number; children: ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useEffect(() => { const e = { ref: g, centre, range }; gates.add(e); return () => { gates.delete(e); }; }, [centre, range]);
  useFrame(({ camera }) => { if (g.current) g.current.visible = Math.abs(camera.position.z - centre) < range; });
  return <group ref={g}>{children}</group>;
}

/* A straight passage between rooms: floor, ceiling, two walls, a recessed light slit. */
export function Corridor({ z0, z1, w = CORR.w, h = CORR.h, reflective = false }: { z0: number; z1: number; w?: number; h?: number; reflective?: boolean }) {
  const l = Math.abs(z1 - z0), cz = (z0 + z1) / 2;
  return (
    <group>
      <Floor w={w} l={l} position={[0, 0, cz]} flat={!reflective} />
      <Wall w={w} h={l} position={[0, h, cz]} rotation={[Math.PI / 2, 0, 0]} tint="#4a4843" />
      <Wall w={l} h={h} position={[-w / 2, h / 2, cz]} rotation={[0, Math.PI / 2, 0]} />
      <Wall w={l} h={h} position={[w / 2, h / 2, cz]} rotation={[0, -Math.PI / 2, 0]} />
      <Slit position={[0, h - 0.02, cz]} size={[0.2, Math.max(1, l - 1.5)]} intensity={7} centreZ={cz} reach={Math.max(9, l)} />
    </group>
  );
}

/* A wall with a doorway cut into it, doorway centred on x=0. dir=1 faces +z (the far wall of a room you walk toward);
   dir=-1 faces -z (the entry wall of the next room, seen from inside it). The wall thickness shows as a reveal. */
export function DoorWall({ z, w, h, doorW = CORR.w, doorH = 3.2, tint, depth = 0.4, dir = 1, reveal = false }: { z: number; w: number; h: number; doorW?: number; doorH?: number; tint?: string; depth?: number; dir?: 1 | -1; reveal?: boolean }) {
  const side = (w - doorW) / 2;
  return (
    <group position={[0, 0, z]} rotation={[0, dir === 1 ? 0 : Math.PI, 0]}>
      <Wall w={side} h={h} position={[-(doorW / 2 + side / 2), h / 2, 0]} tint={tint} />
      <Wall w={side} h={h} position={[doorW / 2 + side / 2, h / 2, 0]} tint={tint} />
      <Wall w={doorW} h={h - doorH} position={[0, doorH + (h - doorH) / 2, 0]} tint={tint} />
      {reveal && [-1, 1].map((s) => (
        <mesh key={s} position={[s * doorW / 2, doorH / 2, -depth / 2]} rotation={[0, -s * Math.PI / 2, 0]} receiveShadow>
          <planeGeometry args={[depth, doorH]} /><ConcreteMaterial repeat={[0.4, 1.3]} tint="#8a8780" />
        </mesh>
      ))}
      {reveal && <mesh position={[0, doorH, -depth / 2]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[doorW, depth]} /><ConcreteMaterial repeat={[1.2, 0.2]} tint="#5d5b56" /></mesh>}
    </group>
  );
}

/* A rectangular room: floor, ceiling, side walls, entry wall (with doorway) and exit wall (with doorway). z0 is the entry, z1 the exit (z1 < z0). */
export function BoxRoom({ z0, z1, w, h, reflective = true, wallTint, floorTint, children }: { z0: number; z1: number; w: number; h: number; reflective?: boolean; wallTint?: string; floorTint?: string; children?: ReactNode }) {
  const l = Math.abs(z1 - z0), cz = (z0 + z1) / 2;
  return (
    <group>
      <Floor w={w} l={l} position={[0, 0, cz]} flat={!reflective} tint={floorTint} />
      <Wall w={w} h={l} position={[0, h, cz]} rotation={[Math.PI / 2, 0, 0]} tint="#4a4843" />
      <Wall w={l} h={h} position={[-w / 2, h / 2, cz]} rotation={[0, Math.PI / 2, 0]} tint={wallTint} />
      <Wall w={l} h={h} position={[w / 2, h / 2, cz]} rotation={[0, -Math.PI / 2, 0]} tint={wallTint} />
      <DoorWall z={z0} w={w} h={h} dir={-1} tint={wallTint} />
      <DoorWall z={z1} w={w} h={h} dir={1} tint={wallTint} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (w / 2 - 0.02), 0.045, cz]}><boxGeometry args={[0.04, 0.09, l]} /><WallMaterial repeat={[0.2, 0.2]} tint="#161513" /></mesh>
      ))}
      {children}
    </group>
  );
}
