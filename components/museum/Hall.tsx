"use client";
import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { HALL } from "@/lib/rooms";
import { WallMaterial, ConcreteMaterial } from "./Materials";
import { Floor, Slit, roomGain } from "./parts";
import { Wall, DoorWall } from "./shell";
import { S } from "@/lib/store";

/* Home: a long dark concrete hall with three ceiling slits, a concrete column, and a doorway at the back. */
export function Hall() {
  const { w, l, h } = HALL;
  const spot = useRef<THREE.SpotLight>(null);
  const target = useRef<THREE.Object3D>(null);
  useFrame(({ camera }) => {
    if (spot.current) {
      spot.current.intensity = 160 * S.lights * roomGain(camera.position.z, -8, 12);
      if (target.current) spot.current.target = target.current;
    }
  });
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
      <spotLight ref={spot} position={[0, h - 0.3, -3.2]} angle={0.42} penumbra={1} decay={2} distance={22} color="#ffd6a0" castShadow shadow-mapSize={[1024, 1024]} shadow-radius={6} shadow-bias={-0.0004} />
      <object3D ref={target} position={[0, 2.3, back]} />
    </group>
  );
}
