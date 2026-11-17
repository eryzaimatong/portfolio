"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { pathAt, EYE } from "@/lib/rooms";
import { EXP_ANGLES } from "./ExperienceRoom";
import { LEAD_CUBES } from "./LeadershipRoom";
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
    // turn toward whatever is selected in the current room; portrait screens turn fully, wide screens lean
    const portrait = state.size.width / state.size.height < 1;
    let target = 0;
    if (room === "Projects") target = (S.selected === 0 ? 1 : -1) * (portrait ? 0.47 : 0.16);
    else if (room === "Experience" && z > -95.5) target = Math.max(-0.85, Math.min(0.85, (-EXP_ANGLES[S.expSel] * Math.PI) / 180 * (portrait ? 0.95 : 0.75)));
    else if (room === "Leadership" && z < -103.5 && z > -116) target = (-LEAD_CUBES[S.leadSel].ax * Math.PI) / 180 * (portrait ? 0.85 : 0.6);
    yaw.current += (target - yaw.current) * Math.min(1, dt * 3);
    camera.position.set(Math.sin(time * 0.6) * 0.004, EYE + Math.sin(time * 0.9) * 0.004, z);
    camera.rotation.set(0, yaw.current, 0);
    if (S.t !== t) set({ t });
    if (S.room !== room) set({ room });
  });
  return null;
}
