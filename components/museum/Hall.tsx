"use client";
import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { HALL, CORRIDOR } from "@/lib/rooms";
import { WallMaterial, ConcreteMaterial } from "./Materials";
import { Floor, Slit, roomGain, tile } from "./parts";
import { S } from "@/lib/store";

const DOOR_W = CORRIDOR.w, DOOR_H = 3.2;

function Wall({ w, h, position, rotation = [0, 0, 0] as [number, number, number], tint }: { w: number; h: number; position: [number, number, number]; rotation?: [number, number, number]; tint?: string }) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow castShadow>
      <planeGeometry args={[w, h]} />
      <WallMaterial repeat={tile(w, h)} tint={tint} />
    </mesh>
  );
}

/* Home: a long dark concrete hall with three ceiling slits, a concrete column, and a doorway at the back that leads down a corridor. */
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
  const sideW = (w - DOOR_W) / 2;
  return (
    <group>
      <Floor w={w} l={l} position={[0, 0, -l / 2]} />
      {/* ceiling */}
      <Wall w={w} h={l} position={[0, h, -l / 2]} rotation={[Math.PI / 2, 0, 0]} tint="#3f3d39" />
      {/* side walls */}
      <Wall w={l} h={h} position={[-w / 2, h / 2, -l / 2]} rotation={[0, Math.PI / 2, 0]} />
      <Wall w={l} h={h} position={[w / 2, h / 2, -l / 2]} rotation={[0, -Math.PI / 2, 0]} />
      {/* entrance wall behind the visitor */}
      <Wall w={w} h={h} position={[0, h / 2, 0]} rotation={[0, Math.PI, 0]} />
      {/* back wall with a doorway */}
      <Wall w={sideW} h={h} position={[-(DOOR_W / 2 + sideW / 2), h / 2, back]} />
      <Wall w={sideW} h={h} position={[DOOR_W / 2 + sideW / 2, h / 2, back]} />
      <Wall w={DOOR_W} h={h - DOOR_H} position={[0, DOOR_H + (h - DOOR_H) / 2, back]} />
      {/* a concrete column, so the space has structure and the light has something to wrap around */}
      <mesh position={[-2.7, h / 2, -8.5]} castShadow receiveShadow>
        <cylinderGeometry args={[0.38, 0.38, h, 48]} />
        <ConcreteMaterial repeat={[1.2, 1.6]} />
      </mesh>
      {/* skirting shadow gap: a dark recessed strip where wall meets floor */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (w / 2 - 0.02), 0.045, -l / 2]}><boxGeometry args={[0.04, 0.09, l]} /><WallMaterial repeat={[0.2, 0.2]} tint="#161513" /></mesh>
      ))}
      {/* door reveal: the wall has thickness, so the doorway has depth */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * DOOR_W / 2, DOOR_H / 2, back - 0.2]} rotation={[0, -s * Math.PI / 2, 0]} receiveShadow><planeGeometry args={[0.4, DOOR_H]} /><ConcreteMaterial repeat={[0.4, 1.3]} tint="#8a8780" /></mesh>
      ))}
      <mesh position={[0, DOOR_H, back - 0.2]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[DOOR_W, 0.4]} /><ConcreteMaterial repeat={[1.2, 0.2]} tint="#5d5b56" /></mesh>
      {/* three ceiling slits */}
      {[-2.6, 0, 2.6].map((x) => (<Slit key={x} position={[x, h - 0.02, -8]} size={[0.22, 13]} intensity={11} centreZ={-8} reach={14} />))}
      {/* one shadow-casting spotlight washing the back wall, where the name sits */}
      <spotLight ref={spot} position={[0, h - 0.3, -3.2]} angle={0.42} penumbra={1} decay={2} distance={22} color="#ffd6a0" castShadow shadow-mapSize={[1024, 1024]} shadow-radius={6} shadow-bias={-0.0004} />
      <object3D ref={target} position={[0, 2.3, back]} />
      {/* corridor */}
      <Corridor />
    </group>
  );
}

function Corridor() {
  const { w, l, h } = CORRIDOR;
  const z0 = -HALL.l;
  const cz = z0 - l / 2;
  return (
    <group>
      <Floor w={w} l={l} position={[0, 0, cz]} />
      <Wall w={w} h={l} position={[0, h, cz]} rotation={[Math.PI / 2, 0, 0]} tint="#3f3d39" />
      <Wall w={l} h={h} position={[-w / 2, h / 2, cz]} rotation={[0, Math.PI / 2, 0]} />
      <Wall w={l} h={h} position={[w / 2, h / 2, cz]} rotation={[0, -Math.PI / 2, 0]} />
      <Slit position={[0, h - 0.02, cz]} size={[0.2, l - 1.5]} intensity={7} centreZ={cz} reach={9} />
    </group>
  );
}
