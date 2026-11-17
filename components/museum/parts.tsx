"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { usePBR, WallMaterial } from "./Materials";
import { S, useStore } from "@/lib/store";
import { anchors, newId } from "@/lib/lights";

RectAreaLightUniformsLib.init();

/* Light follows the camera: a room's lights ease up as you approach and down as you leave. `centre`/`reach` are on the z axis. */
export function roomGain(camZ: number, centre: number, reach: number) {
  const d = Math.abs(camZ - centre);
  const k = Math.min(Math.max(1 - d / reach, 0), 1);
  return 0.3 + 0.7 * (k * k * (3 - 2 * k));
}

/* Polished floor. High tier: real planar reflection (crisp near, blurred far). Others: low-roughness PBR plus the environment. */
export function Floor({ w, l, round, half, position, flat, tint = "#d2cec6" }: { w: number; l: number; round?: boolean; half?: boolean; position: [number, number, number]; flat?: boolean; tint?: string }) {
  const tier = useStore((s) => s.tier);
  const pbr = usePBR("concrete_floor_worn_001", [w / 3, l / 3]);
  const geo = half ? <circleGeometry args={[w / 2, 96, 0, Math.PI]} /> : round ? <circleGeometry args={[w / 2, 96]} /> : <planeGeometry args={[w, l]} />;
  const { metalnessMap: _m, ...rest } = pbr;     // keeps the roughness map (gate 1); the scalar below keeps the polish clear
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position} receiveShadow>
      {geo}
      {tier === "high" && !flat ? (
        <MeshReflectorMaterial
          {...rest}
          color={tint} blur={[90, 30]} mixBlur={0.9} mixStrength={4.5} mixContrast={1.2} resolution={512} mirror={1}
          depthScale={1.2} minDepthThreshold={0.4} maxDepthThreshold={1.6} metalness={0} roughness={0.32} normalScale={new THREE.Vector2(0.3, 0.3)} />
      ) : (
        <meshStandardMaterial {...pbr} color="#a09c95" roughness={0.3} metalness={0} envMapIntensity={1.6} normalScale={new THREE.Vector2(0.35, 0.35)} />
      )}
    </mesh>
  );
}

/* A ceiling light slit set into a dark cove: a recessed channel and a thin emissive fixture. The light itself comes from the shared
   light pool (lib/lights.ts): this registers where light should come from. */
export function Slit({ position, size, intensity = 8, color = "#ffd8aa", centreZ, reach = 14 }: { position: [number, number, number]; size: [number, number]; intensity?: number; color?: string; centreZ: number; reach?: number }) {
  const fix = useRef<THREE.MeshStandardMaterial>(null);
  const probe = useRef<THREE.Object3D>(null);
  const id = useRef(newId());
  useEffect(() => {
    const p = probe.current; if (!p) return;
    p.updateWorldMatrix(true, false);
    const pos = new THREE.Vector3(), quat = new THREE.Quaternion();
    p.getWorldPosition(pos); p.getWorldQuaternion(quat);
    const me = id.current;
    anchors.set(me, { id: me, pos, quat, w: size[0], h: size[1], intensity, color, centre: centreZ, reach });
    return () => { anchors.delete(me); };
  }, [size[0], size[1], intensity, color, centreZ, reach, position[0], position[1], position[2]]);
  useFrame(({ camera }) => {
    const g = S.lights * roomGain(camera.position.z, centreZ, reach);
    if (fix.current) fix.current.emissiveIntensity = 1.3 * g;
  });
  const cw = size[0] + 0.22, cl = size[1] + 0.22;
  return (
    <group position={position}>
      {[[0, cl / 2, cw, 0.14, 0], [0, -cl / 2, cw, 0.14, 0], [cw / 2, 0, 0.14, cl, 1], [-cw / 2, 0, 0.14, cl, 1]].map(([x, z, a, b], i) => (
        <mesh key={i} position={[x, -0.07, z]}>
          <boxGeometry args={[a, 0.14, b]} /><WallMaterial repeat={[0.3, 0.3]} tint="#1c1b19" />
        </mesh>
      ))}
      <mesh position={[0, 0.0, 0]} rotation={[Math.PI / 2, 0, 0]} userData={{ fixture: true }}>
        <planeGeometry args={size} />
        <meshStandardMaterial ref={fix} color="#1a1713" emissive={color} emissiveIntensity={1.3} roughness={0.8} />
      </mesh>
      <object3D ref={probe} position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} />
    </group>
  );
}

export const tile = (w: number, h: number): [number, number] => [w / 2.4, h / 2.4];
export { THREE };
