"use client";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { CameraRig } from "./CameraRig";
import { Hall } from "./Hall";
import { AboutRoom } from "./AboutRoom";
import { ProjectsRoom } from "./ProjectsRoom";
import { SkillsHallway } from "./SkillsHallway";
import { ExperienceRoom } from "./ExperienceRoom";
import { LeadershipRoom } from "./LeadershipRoom";
import { ContactRoom } from "./ContactRoom";
import { Corridor, RoomGate, applyGates } from "./shell";
import { Floor } from "./parts";
import { Post } from "./Post";
import { LightPool } from "./LightPool";
import { CORRIDORS } from "@/lib/rooms";
import { S, set, useStore } from "@/lib/store";

/* Drives the lights-up entrance: a time-based ease (about 1 s). It is not tied to scroll and never blocks it. */
function LightsDriver() {
  useFrame((_, dt) => {
    const target = S.entered ? 1 : 0.14;
    S.lights += (target - S.lights) * Math.min(1, dt * 3.2);
    if (Math.abs(target - S.lights) < 0.002) S.lights = target;
  });
  return null;
}

/* Compiles every shader the walk will need, one room at a time, behind a short "Preparing" veil, so no room stalls when you first enter it. */
function Warmup() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let dead = false;
    (async () => {
      const zs = [-1.2, -14, -22, -29, -40, -50, -57, -70, -86, -92, -100, -110, -119, -131];
      const t0 = performance.now();
      for (const z of zs) {
        if (dead) return;
        if (performance.now() - t0 > 20000) break;         // never hold the page hostage: after 20 s just show it
        camera.position.set(0, 1.6, z); camera.rotation.set(0, 0, 0); camera.updateMatrixWorld();
        applyGates(z);
        try { await Promise.race([(gl as any).compileAsync(scene, camera), new Promise((r) => setTimeout(r, 3500))]); } catch {}   // a hidden tab never resolves compileAsync, so each step is capped
      }
      if (!dead) set({ ready: true });
    })();
    return () => { dead = true; };
  }, [gl, scene, camera]);
  return null;
}

/* The contact doorway's light, spilling back into the room: the only other real light, always present so the light count never changes. */
function ContactSpill() {
  const l = useRef<THREE.RectAreaLight>(null);
  useFrame(({ camera }) => {
    const near = Math.min(1, Math.max(0, 1 - (camera.position.z - -135) / 26));
    if (l.current) l.current.intensity = 26 * S.lights * (0.35 + 0.65 * near) * (near > 0.02 ? 1 : 0);
  });
  return <rectAreaLight ref={l} position={[0, 1.7, -138.2]} rotation={[0, Math.PI, 0]} width={2.2} height={2.6} color="#ffdcae" intensity={0} />;
}

function Expose() {
  const { scene, gl } = useThree();
  useEffect(() => { (window as any).__scene = scene; (window as any).__gl = gl; }, [scene, gl]);
  return null;
}

export default function Scene() {
  const tier = useStore((s) => s.tier);
  return (
    <div className="stage-canvas" aria-hidden="true">
      <Canvas
        shadows="soft" dpr={[1, 1.75]} camera={{ fov: 40, near: 0.1, far: 80, position: [0, 1.6, -1.2] }}
        gl={{ antialias: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping, preserveDrawingBuffer: true }}>
        <color attach="background" args={["#0c0c0b"]} />
        <fog attach="fog" args={["#0c0c0b", 16, 50]} />
        <Suspense fallback={null}>
          <Environment files="/hdri/photo_studio_loft_hall_1k.hdr" environmentIntensity={tier === "high" ? 0.3 : 0.34} background={false} />
          {/* a cool, very dim fill (about 6000K) against the warm key lights, for natural colour contrast */}
          <hemisphereLight args={["#a9bde8", "#1c1a18", 0.22]} />
          <RoomGate centre={-8} range={26}><Hall /></RoomGate>
          {CORRIDORS.map(([a, b]) => (<RoomGate key={a} centre={(a + b) / 2} range={22}><Corridor z0={a} z1={b} /></RoomGate>))}
          <RoomGate centre={-29} range={24}><AboutRoom /></RoomGate>
          <RoomGate centre={-50} range={24}><ProjectsRoom /></RoomGate>
          <RoomGate centre={-73} range={32}><SkillsHallway /></RoomGate>
          <RoomGate centre={-91} range={22}><ExperienceRoom /></RoomGate>
          <RoomGate centre={-110} range={24}><LeadershipRoom /></RoomGate>
          <RoomGate centre={-128} range={24}><ContactRoom /></RoomGate>
          <LightPool />
          <ContactSpill />
          <Warmup />
          <CameraRig />
          <LightsDriver />
          <Post />
          <Expose />
        </Suspense>
      </Canvas>
    </div>
  );
}
