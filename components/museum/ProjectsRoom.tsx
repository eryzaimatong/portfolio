"use client";
import { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SpotLight, Sparkles, Text, useTexture, useDepthBuffer } from "@react-three/drei";
import { projects } from "@/data/projects";
import { PROJ, CORRIDOR } from "@/lib/rooms";
import { WallMaterial, ConcreteMaterial, OakMaterial, usePBR } from "./Materials";
import { Floor, Slit, roomGain, tile } from "./parts";
import { S, set, useStore } from "@/lib/store";

const { zc, r: R, h: H, door } = PROJ;
const GAP = Math.asin(door / 2 / R);
const FRAME_ANGLES = [Math.PI + 0.46, Math.PI - 0.46];       // left (Re:Watch) and right (AURA) of the central doorway
const SIZES: [number, number][] = [[2.4, 1.5], [1.0, 2.15]];  // artwork sizes follow each image's real aspect ratio
const CY = 1.72;

function Artwork({ index }: { index: number }) {
  const p = projects[index];
  const g = useRef<THREE.Group>(null);
  const sel = useStore((s) => s.selected === index);
  const [aw, ah] = SIZES[index];
  const tex = useTexture(p.cover);
  const grain = usePBR("oak_veneer_01", [3, 3]);       // a faint paper grain so the print is a PBR surface, not a flat decal
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  const theta = FRAME_ANGLES[index];
  const rad = R - 0.05;
  const pos: [number, number, number] = [rad * Math.sin(theta), CY, zc + rad * Math.cos(theta)];
  const mat = 0.16, fw = 0.06, fd = 0.07;
  const mw = aw + mat * 2, mh = ah + mat * 2;
  const dim = useRef(1);
  const art = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_, dt) => {
    const k = Math.min(1, dt * 5.5);
    const a = S.selected === index ? 1 : 0;
    if (g.current) {
      g.current.position.z += ((a ? 0.3 : 0) - g.current.position.z) * k;        // steps forward under the spotlight (kept small so it still reads as hung)
      const s = g.current.scale.x + ((a ? 1.035 : 1) - g.current.scale.x) * k;
      g.current.scale.setScalar(s);
    }
    dim.current += ((a ? 1 : 0.62) - dim.current) * k;
    if (art.current) art.current.color.setScalar(dim.current);
  });

  const onClick = (e: any) => {
    e.stopPropagation();
    if (S.selected !== index) set({ selected: index }); else set({ inspect: index });
  };

  return (
    <group position={pos} rotation={[0, theta + Math.PI, 0]}>
      <group ref={g}>
        {/* frame: four slim oak members around a bevelled mat */}
        {[
          [0, mh / 2 + fw / 2, mw + fw * 2, fw], [0, -mh / 2 - fw / 2, mw + fw * 2, fw],
          [-mw / 2 - fw / 2, 0, fw, mh], [mw / 2 + fw / 2, 0, fw, mh],
        ].map(([x, y, w, h], i) => (
          <mesh key={i} position={[x, y, fd / 2]} castShadow receiveShadow>
            <boxGeometry args={[w, h, fd]} /><OakMaterial repeat={[1, 1]} />
          </mesh>
        ))}
        <mesh position={[0, 0, 0.012]} receiveShadow>
          <boxGeometry args={[mw, mh, 0.024]} /><WallMaterial repeat={[1, 1]} tint="#e6dfcf" />
        </mesh>
        {/* the real project image */}
        <mesh position={[0, 0, 0.03]} onClick={onClick} onPointerOver={() => (document.body.style.cursor = "pointer")} onPointerOut={() => (document.body.style.cursor = "")} receiveShadow>
          <planeGeometry args={[aw, ah]} />
          <meshStandardMaterial ref={art} map={tex} normalMap={grain.normalMap} roughnessMap={grain.roughnessMap} normalScale={new THREE.Vector2(0.06, 0.06)} roughness={0.6} metalness={0} envMapIntensity={0.4} />
        </mesh>
        {/* plaque below: catalogue number, name, year */}
        <group position={[0, -mh / 2 - 0.42, 0.03]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[Math.max(1.1, aw * 0.7), 0.26, 0.03]} /><OakMaterial repeat={[1, 0.3]} tint="#2a1f17" />
          </mesh>
          <Text font="/fonts/geist-mono-500.woff" fontSize={0.075} color="#EDE6D6" anchorX="left" anchorY="middle" position={[-Math.max(1.1, aw * 0.7) / 2 + 0.2, 0, 0.02]} letterSpacing={0.02}>
            {`${String(index + 1).padStart(2, "0")}   ${p.title}`}
          </Text>
          <Text font="/fonts/geist-mono-400.woff" fontSize={0.055} color="#A8A294" anchorX="right" anchorY="middle" position={[Math.max(1.1, aw * 0.7) / 2 - 0.14, 0, 0.02]}>
            {String(p.year)}
          </Text>
        </group>
      </group>
    </group>
  );
}

/* One spotlight that slides between the works. Soft cone, soft penumbra, shadow, dust in the beam. */
function Spot() {
  const depth = useDepthBuffer({ size: 512, frames: 1 });
  const light = useRef<THREE.SpotLight>(null);
  const dust = useRef<THREE.Group>(null);
  const cur = useRef(new THREE.Vector3());
  useFrame(({ camera }, dt) => {
    const th = FRAME_ANGLES[S.selected];
    const rad = R - 1.6;
    const px = rad * Math.sin(th) * 0.82, pz = zc + rad * Math.cos(th) * 0.82;      // above and in front of the work
    const tx = (R - 0.9) * Math.sin(th), tz = zc + (R - 0.9) * Math.cos(th);
    const k = Math.min(1, dt * 4.5);
    cur.current.x += (tx - cur.current.x) * k; cur.current.z += (tz - cur.current.z) * k;
    const l = light.current;
    if (l) {
      l.position.set(px * 0.0 + cur.current.x * 0.78, H - 0.25, zc + (cur.current.z - zc) * 0.78);
      l.target.position.set(cur.current.x, CY, cur.current.z);
      l.target.updateMatrixWorld();
      l.intensity = 520 * S.lights * roomGain(camera.position.z, zc, 12);
    }
    if (dust.current) dust.current.position.set(cur.current.x * 0.9, 2.6, zc + (cur.current.z - zc) * 0.9);
  });
  return (
    <>
      <SpotLight ref={light as any} depthBuffer={depth} castShadow color="#ffe2bd" angle={0.34} penumbra={1} distance={14} decay={2}
        attenuation={7} anglePower={4} opacity={0.4} radiusTop={0.12} radiusBottom={1.5} shadow-mapSize={[1024, 1024]} shadow-radius={6} shadow-bias={-0.0004} />
      <group ref={dust}>
        <Sparkles count={70} scale={[2.6, 3.4, 2.6]} size={2.6} speed={0.12} opacity={0.5} color="#ffe6c0" noise={0.4} />
      </group>
    </>
  );
}

/* Projects: a round gallery with two doorways (in and through). Two real works flank the doorway you walk out of. */
export function ProjectsRoom() {
  const arc = Math.PI - GAP * 2;
  const arcLen = R * arc;
  return (
    <group>
      <Floor w={R * 2} l={R * 2} round position={[0, 0, zc]} />
      {/* curved wall: two segments, leaving a doorway front (+z) and back (-z) */}
      {[GAP, Math.PI + GAP].map((start) => (
        <mesh key={start} position={[0, H / 2, zc]} receiveShadow castShadow>
          <cylinderGeometry args={[R, R, H, 96, 1, true, start, arc]} />
          <WallMaterial repeat={tile(arcLen, H)} side={THREE.BackSide} />
        </mesh>
      ))}
      {/* skirting shadow gap */}
      {[GAP, Math.PI + GAP].map((start) => (
        <mesh key={"sk" + start} position={[0, 0.045, zc]}>
          <cylinderGeometry args={[R - 0.025, R - 0.025, 0.09, 96, 1, true, start, arc]} />
          <WallMaterial repeat={[6, 0.1]} tint="#161513" side={THREE.BackSide} />
        </mesh>
      ))}
      {/* door reveals (the wall has thickness): front and back openings */}
      {[zc + R - 0.1, zc - R + 0.1].map((z, fi) => [-1, 1].map((s) => (
        <mesh key={fi + "-" + s} position={[s * (door / 2), 1.6, z + (fi === 0 ? 0.2 : -0.2)]} rotation={[0, -s * Math.PI / 2, 0]}>
          <planeGeometry args={[0.4, 3.2]} /><ConcreteMaterial repeat={[0.4, 1.3]} tint="#8a8780" />
        </mesh>
      )))}
      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, zc]}>
        <circleGeometry args={[R, 96]} /><WallMaterial repeat={[R / 1.5, R / 1.5]} tint="#4a4843" />
      </mesh>
      {/* two ceiling slits wash the floor near the walls */}
      <Slit position={[-4.6, H - 0.02, zc]} size={[0.2, 8]} intensity={30} centreZ={zc} reach={12} />
      <Slit position={[4.6, H - 0.02, zc]} size={[0.2, 8]} intensity={30} centreZ={zc} reach={12} />
      <Artwork index={0} />
      <Artwork index={1} />
      <Spot />
      <Antechamber />
    </group>
  );
}

/* The space beyond the back doorway: where the walk continues. A lit threshold, so the doorway reads as a doorway. */
function Antechamber() {
  const w = CORRIDOR.w, l = 5, h = 3.4, z0 = zc - R, cz = z0 - l / 2;
  return (
    <group>
      <Floor w={w} l={l} position={[0, 0, cz]} />
      <mesh position={[0, h, cz]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[w, l]} /><WallMaterial repeat={tile(w, l)} tint="#3f3d39" /></mesh>
      <mesh position={[-w / 2, h / 2, cz]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[l, h]} /><WallMaterial repeat={tile(l, h)} /></mesh>
      <mesh position={[w / 2, h / 2, cz]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[l, h]} /><WallMaterial repeat={tile(l, h)} /></mesh>
      <mesh position={[0, h / 2, z0 - l]}><planeGeometry args={[w, h]} /><WallMaterial repeat={tile(w, h)} /></mesh>
      <Slit position={[0, h - 0.02, cz]} size={[0.2, l - 1]} intensity={5} color="#ffd9aa" centreZ={cz} reach={10} />
    </group>
  );
}
