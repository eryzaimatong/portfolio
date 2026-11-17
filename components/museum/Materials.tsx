"use client";
import { useMemo } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";

/* PBR sets (Poly Haven, CC0). `arm` packs AO (R), roughness (G), metalness (B): one texture feeds three slots. */
export type PBRName = "plastered_wall" | "concrete_layers_02" | "concrete_floor_worn_001" | "oak_veneer_01";

export function usePBR(name: PBRName, repeat: [number, number] = [1, 1], rotate = 0) {
  const [diff, nor, arm] = useTexture([`/textures/${name}/diff.jpg`, `/textures/${name}/nor.jpg`, `/textures/${name}/arm.jpg`]);
  return useMemo(() => {
    const out = [diff, nor, arm].map((t, i) => {
      const c = t.clone();
      c.wrapS = c.wrapT = THREE.RepeatWrapping;
      c.repeat.set(repeat[0], repeat[1]);
      c.rotation = rotate;
      c.anisotropy = 8;
      c.colorSpace = i === 0 ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      c.needsUpdate = true;
      return c;
    });
    return { map: out[0], normalMap: out[1], aoMap: out[2], roughnessMap: out[2], metalnessMap: out[2] };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diff, nor, arm, repeat[0], repeat[1], rotate]);
}

/* Walls: fine plaster, kept dark by tint so the light does the work. */
export function WallMaterial({ repeat, tint = "#8d8a84", side }: { repeat: [number, number]; tint?: string; side?: THREE.Side }) {
  const m = usePBR("plastered_wall", repeat);
  return <meshStandardMaterial {...m} color={tint} roughness={1} metalness={0} normalScale={new THREE.Vector2(0.9, 0.9)} aoMapIntensity={1} envMapIntensity={0.6} side={side} />;
}

/* Board-formed concrete for structure: columns, soffits, door reveals. */
export function ConcreteMaterial({ repeat = [1, 1] as [number, number], tint = "#77746e", side }: { repeat?: [number, number]; tint?: string; side?: THREE.Side }) {
  const m = usePBR("concrete_layers_02", repeat);
  return <meshStandardMaterial {...m} color={tint} roughness={1} metalness={0} normalScale={new THREE.Vector2(1, 1)} envMapIntensity={0.6} side={side} />;
}

/* Honed oak for frames and plaques. */
export function OakMaterial({ repeat = [1, 1] as [number, number], tint = "#4a3626" }: { repeat?: [number, number]; tint?: string }) {
  const m = usePBR("oak_veneer_01", repeat);
  return <meshStandardMaterial {...m} color={tint} roughness={0.85} metalness={0} envMapIntensity={0.7} />;
}
