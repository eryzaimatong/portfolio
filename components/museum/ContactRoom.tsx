"use client";
import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { CONTACT } from "@/lib/rooms";
import { Slit } from "./parts";
import { BoxRoom, Wall } from "./shell";
import { S } from "@/lib/store";

const { z0, z1, w, h } = CONTACT;

/* Contact: a calm room that opens onto a softly lit doorway; the light spills across the polished floor. */
export function ContactRoom() {
  const spill = useRef<THREE.RectAreaLight>(null);
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ camera }) => {
    const near = Math.min(1, Math.max(0, 1 - (camera.position.z - z1) / 26));          // the doorway brightens as you walk toward it
    const g = S.lights * (0.35 + 0.65 * near);
    if (spill.current) spill.current.intensity = 26 * g;
    if (glow.current) glow.current.emissiveIntensity = 2.2 * g;
  });
  const cz = (z0 + z1) / 2;
  return (
    <BoxRoom z0={z0} z1={z1} w={w} h={h} floorTint="#d6d2c9">
      <Slit position={[-2.4, h - 0.02, cz]} size={[0.18, 10]} intensity={12} centreZ={cz} reach={16} />
      <Slit position={[2.4, h - 0.02, cz]} size={[0.18, 10]} intensity={12} centreZ={cz} reach={16} />
      {/* beyond the doorway: a bright wall and a real area light spilling back into the room */}
      <Wall w={3} h={3.2} position={[0, 1.6, z1 - 3.2]} tint="#3a3834" />
      <mesh position={[0, 1.7, z1 - 3.15]} userData={{ fixture: true }}>
        <planeGeometry args={[2.2, 2.6]} />
        <meshStandardMaterial ref={glow} color="#1b1915" emissive="#ffe4bd" emissiveIntensity={2.2} roughness={0.9} />
      </mesh>
      <rectAreaLight ref={spill} position={[0, 1.7, z1 - 2.6]} rotation={[0, Math.PI, 0]} width={2.2} height={2.6} color="#ffdcae" intensity={26} />
      <Wall w={3} h={3.2} position={[-1.5, 1.6, z1 - 1.6]} rotation={[0, Math.PI / 2, 0]} />
      <Wall w={3} h={3.2} position={[1.5, 1.6, z1 - 1.6]} rotation={[0, -Math.PI / 2, 0]} />
      <Wall w={3} h={3.4} position={[0, 3.4, z1 - 1.6]} rotation={[Math.PI / 2, 0, 0]} tint="#4a4843" />
    </BoxRoom>
  );
}
