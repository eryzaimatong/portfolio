"use client";
import { Suspense, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { CameraRig } from "./CameraRig";
import { Hall } from "./Hall";
import { ProjectsRoom } from "./ProjectsRoom";
import { Post } from "./Post";
import { S, useStore } from "@/lib/store";

/* Drives the lights-up entrance: a time-based ease (about 1 s). It is not tied to scroll and never blocks it. */
function LightsDriver() {
  useFrame((_, dt) => {
    const target = S.entered ? 1 : 0.14;
    S.lights += (target - S.lights) * Math.min(1, dt * 3.2);
    if (Math.abs(target - S.lights) < 0.002) S.lights = target;
  });
  return null;
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
          <Hall />
          <ProjectsRoom />
          <CameraRig />
          <LightsDriver />
          <Post />
          <Expose />
        </Suspense>
      </Canvas>
    </div>
  );
}
