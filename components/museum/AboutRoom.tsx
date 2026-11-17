"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Text, useTexture } from "@react-three/drei";
import { about } from "@/data/profile";
import { ABOUT } from "@/lib/rooms";
import { usePBR } from "./Materials";
import { Slit } from "./parts";
import { useSpotRequest } from "./LightPool";
import { BoxRoom } from "./shell";
import { Frame } from "./frame";
import { S } from "@/lib/store";

const { z0, z1, w, h } = ABOUT;
const BACK = z1 + 0.012;
const MONO = "/fonts/geist-mono-500.woff";
const SANS = "/fonts/geist-sans-400.woff";
const SANS_B = "/fonts/geist-sans-600.woff";

/* The portrait warms from grayscale to colour over about two seconds once you are close enough to be in its light. */
function Portrait() {
  const tex = useTexture(about.photo.src);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 16;
  const grain = usePBR("oak_veneer_01", [3, 3]);
  const warm = useRef({ value: 0 });
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ map: tex, normalMap: grain.normalMap, roughnessMap: grain.roughnessMap, normalScale: new THREE.Vector2(0.015, 0.015), roughness: 0.6, metalness: 0, envMapIntensity: 0.4 });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uWarm = warm.current;
      sh.fragmentShader = "uniform float uWarm;\n" + sh.fragmentShader.replace("#include <map_fragment>", "#include <map_fragment>\n float g = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114)); diffuseColor.rgb = mix(vec3(g * 0.92), diffuseColor.rgb, uWarm);");
    };
    return m;
  }, [tex, grain]);
  useFrame(({ camera }, dt) => {
    const near = camera.position.z < -25.5 && camera.position.z > -35;
    warm.current.value += ((near ? 1 : 0) - warm.current.value) * Math.min(1, dt * 1.6);
  });
  return (
    <Frame aw={1.2} ah={1.2} position={[-2.75, 2.45, BACK]} rotation={[0, 0, 0]}>
      <mesh receiveShadow><planeGeometry args={[1.2, 1.2]} /><primitive object={mat} attach="material" /></mesh>
    </Frame>
  );
}

/* Wall text that is a real part of the room: crisp SDF type, with the live site's own words. */
function Label({ x, y, text, width = 2.1, size = 0.072, font = SANS, color = "#EDE6D6" }: { x: number; y: number; text: string; width?: number; size?: number; font?: string; color?: string }) {
  return (
    <Text font={font} fontSize={size} maxWidth={width} lineHeight={1.38} color={color} anchorX="left" anchorY="top" position={[x, y, BACK]} depthOffset={-1}>{text}</Text>
  );
}

export function AboutRoom() {
  const sentences = useMemo(() => about.bio.flatMap((p) => p.split(/(?<=\.)\s+/)), []);   // the existing sentences, unchanged, one per wall label
  useSpotRequest({ pos: [-1.4, h - 0.35, -29.4], target: [-2.75, 2.4, BACK], intensity: 190, color: "#ffe0b8", angle: 0.5, penumbra: 1, distance: 16, centre: -29, reach: 12 });
  return (
    <BoxRoom z0={z0} z1={z1} w={w} h={h}>
      <Slit position={[0, h - 0.02, (z0 + z1) / 2]} size={[0.22, 10]} intensity={12} centreZ={-29} reach={14} />
      {/* portrait left of the doorway, lit by one shadow-casting spotlight */}
      <Portrait />
      {/* left wall piece: who this is */}
      <Label x={-3.95} y={1.62} text={about.heading} font={SANS_B} size={0.135} width={2.4} />
      <Label x={-3.95} y={1.34} text={about.lead} size={0.076} width={2.3} color="#A8A294" />
      {about.fields.map(([k, v], i) => (
        <group key={k}>
          <Text font={MONO} fontSize={0.05} color="#C3A979" anchorX="left" anchorY="top" position={[-3.95 + (i % 2) * 1.25, 0.92 - Math.floor(i / 2) * 0.3, BACK]}>{k.toUpperCase()}</Text>
          <Text font={SANS} fontSize={0.062} color="#EDE6D6" maxWidth={1.15} anchorX="left" anchorY="top" position={[-3.95 + (i % 2) * 1.25, 0.85 - Math.floor(i / 2) * 0.3, BACK]}>{v}</Text>
        </group>
      ))}
      {/* right wall piece: the bio, one existing sentence per label with a hairline rule above it */}
      {sentences.map((t, i) => (
        <group key={i}>
          <mesh position={[2.8, 3.78 - i * 0.84, BACK]} userData={{ fixture: true }}><planeGeometry args={[2.25, 0.004]} /><meshStandardMaterial color="#C3A979" emissive="#C3A979" emissiveIntensity={0.25} roughness={0.7} /></mesh>
          <Label x={1.68} y={3.72 - i * 0.84} text={t} size={0.078} width={2.25} />
        </group>
      ))}
    </BoxRoom>
  );
}
