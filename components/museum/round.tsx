"use client";
import * as THREE from "three";
import { WallMaterial } from "./Materials";
import { Floor, Slit, tile } from "./parts";

/* A round room with a doorway in front (+z) and behind (-z): curved plaster wall, skirting gap, door reveals, ceiling, two slits. */
export function RoundShell({ zc, r, h, door = 3, slitX = 0.58, children }: { zc: number; r: number; h: number; door?: number; slitX?: number; children?: React.ReactNode }) {
  const gap = Math.asin(door / 2 / r);
  const arc = Math.PI - gap * 2;
  const arcLen = r * arc;
  return (
    <group>
      <Floor w={r * 2} l={r * 2} round position={[0, 0, zc]} />
      {[gap, Math.PI + gap].map((start) => (
        <group key={start}>
          <mesh position={[0, h / 2, zc]} receiveShadow castShadow>
            <cylinderGeometry args={[r, r, h, 96, 1, true, start, arc]} />
            <WallMaterial repeat={tile(arcLen, h)} side={THREE.BackSide} />
          </mesh>
          <mesh position={[0, 0.045, zc]}>
            <cylinderGeometry args={[r - 0.025, r - 0.025, 0.09, 96, 1, true, start, arc]} />
            <WallMaterial repeat={[6, 0.1]} tint="#161513" side={THREE.BackSide} />
          </mesh>
        </group>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, zc]}>
        <circleGeometry args={[r, 96]} /><WallMaterial repeat={[r / 1.5, r / 1.5]} tint="#4a4843" />
      </mesh>
      <Slit position={[-r * slitX, h - 0.02, zc]} size={[0.2, r]} intensity={30} centreZ={zc} reach={12} />
      <Slit position={[r * slitX, h - 0.02, zc]} size={[0.2, r]} intensity={30} centreZ={zc} reach={12} />
      {children}
    </group>
  );
}
