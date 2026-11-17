"use client";
import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { usePBR } from "./Materials";
import { S, useStore } from "@/lib/store";

RectAreaLightUniformsLib.init();

/* Light follows the camera: a room's lights ease up as you approach and down as you leave. `centre`/`reach` are on the z axis. */
export function roomGain(camZ: number, centre: number, reach: number) {
  const d = Math.abs(camZ - centre);
  const k = Math.min(Math.max(1 - d / reach, 0), 1);
  return 0.18 + 0.82 * (k * k * (3 - 2 * k));
}

/* Polished floor. High tier: real planar reflection with blur and distance fade. Others: low-roughness PBR plus the environment. */
export function Floor({ w, l, round, position }: { w: number; l: number; round?: boolean; position: [number, number, number] }) {
  const tier = useStore((s) => s.tier);
  const pbr = usePBR("concrete_floor_02", [w / 2.5, l / 2.5]);
  const geo = round ? <circleGeometry args={[w / 2, 96]} /> : <planeGeometry args={[w, l]} />;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position} receiveShadow>
      {geo}
      {tier === "high" ? (
        <MeshReflectorMaterial
          {...pbr}
          color="#7a766f" blur={[380, 120]} mixBlur={1.1} mixStrength={1.6} mixContrast={1} resolution={768} mirror={0.6}
          depthScale={0.7} minDepthThreshold={0.3} maxDepthThreshold={1.4} metalness={0} roughness={1} distortion={0} />
      ) : (
        <meshStandardMaterial {...pbr} color="#7a766f" roughness={0.45} metalness={0} envMapIntensity={1.4} />
      )}
    </mesh>
  );
}

/* A ceiling light slit: a thin emissive fixture plus a real RectAreaLight (area light = real falloff on the surfaces below). */
export function Slit({ position, size, intensity = 6, color = "#ffcf9c", centreZ, reach = 14 }: { position: [number, number, number]; size: [number, number]; intensity?: number; color?: string; centreZ: number; reach?: number }) {
  const light = useRef<THREE.RectAreaLight>(null);
  const fix = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ camera }) => {
    const g = S.lights * roomGain(camera.position.z, centreZ, reach);
    if (light.current) light.current.intensity = intensity * g;
    if (fix.current) fix.current.emissiveIntensity = 2.2 * g;
  });
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]} userData={{ fixture: true }}>
        <planeGeometry args={size} />
        <meshStandardMaterial ref={fix} color="#1a1713" emissive={color} emissiveIntensity={2} roughness={0.8} />
      </mesh>
      <rectAreaLight ref={light} width={size[0]} height={size[1]} color={color} intensity={intensity} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} />
    </group>
  );
}

export const tile = (w: number, h: number): [number, number] => [w / 3, h / 3];
export { THREE };
