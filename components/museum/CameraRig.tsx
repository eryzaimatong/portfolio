"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { pathAt, EYE } from "@/lib/rooms";
import { S, set } from "@/lib/store";

/* Camera mapped 1:1 to scroll. No smoothing on position: the page scrolls natively and the camera follows the exact scroll value.
   Only a tiny breath (centimetres) and a gentle yaw toward the selected work. */
export function CameraRig() {
  const { camera } = useThree();
  const yaw = useRef(0);
  const tRef = useRef(0);

  useEffect(() => {
    const read = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      tRef.current = max > 0 ? window.scrollY / max : 0;
    };
    read();
    addEventListener("scroll", read, { passive: true });
    addEventListener("resize", read);
    return () => { removeEventListener("scroll", read); removeEventListener("resize", read); };
  }, []);

  useFrame((state, dt) => {
    const t = tRef.current;
    const { z, room } = pathAt(t);
    const time = state.clock.elapsedTime;
    // look toward the selected work only while inside the Projects room
    const inProj = room === "Projects" ? 1 : 0;
    // portrait screens see a narrow slice, so they turn fully to the work (about 24 degrees); wide screens only lean toward it
    const amount = state.size.width / state.size.height < 1 ? 0.4 : 0.16;
    const target = inProj * (S.selected === 0 ? amount : -amount);
    yaw.current += (target - yaw.current) * Math.min(1, dt * 3);
    camera.position.set(Math.sin(time * 0.6) * 0.004, EYE + Math.sin(time * 0.9) * 0.004, z);
    camera.rotation.set(0, yaw.current, 0);
    if (S.t !== t) set({ t });
    if (S.room !== room) set({ room });
  });
  return null;
}
