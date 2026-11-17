"use client";
import { HALL } from "@/lib/rooms";
import { WallMaterial, ConcreteMaterial } from "./Materials";
import { Floor, Slit } from "./parts";
import { useSpotRequest } from "./LightPool";
import { Wall, DoorWall } from "./shell";

/* Home: a long dark concrete hall with three ceiling slits, a concrete column, and a doorway at the back. */
export function Hall() {
  const { w, l, h } = HALL;
  useSpotRequest({ pos: [0, h - 0.3, -3.2], target: [0, 2.3, -16], intensity: 160, color: "#ffd6a0", angle: 0.42, penumbra: 1, distance: 22, centre: -8, reach: 12 });
  const back = -l;
  return (
    <group>
      <Floor w={w} l={l} position={[0, 0, -l / 2]} />
      <Wall w={w} h={l} position={[0, h, -l / 2]} rotation={[Math.PI / 2, 0, 0]} tint="#3f3d39" />
      <Wall w={l} h={h} position={[-w / 2, h / 2, -l / 2]} rotation={[0, Math.PI / 2, 0]} />
      <Wall w={l} h={h} position={[w / 2, h / 2, -l / 2]} rotation={[0, -Math.PI / 2, 0]} />
      <Wall w={w} h={h} position={[0, h / 2, 0]} rotation={[0, Math.PI, 0]} />
      <DoorWall z={back} w={w} h={h} />
      <mesh position={[-2.7, h / 2, -8.5]} castShadow receiveShadow>
        <cylinderGeometry args={[0.38, 0.38, h, 48]} />
        <ConcreteMaterial repeat={[1.2, 1.6]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (w / 2 - 0.02), 0.045, -l / 2]}><boxGeometry args={[0.04, 0.09, l]} /><WallMaterial repeat={[0.2, 0.2]} tint="#161513" /></mesh>
      ))}
      {[-2.6, 0, 2.6].map((x) => (<Slit key={x} position={[x, h - 0.02, -8]} size={[0.22, 13]} intensity={11} centreZ={-8} reach={14} />))}
    </group>
  );
}
