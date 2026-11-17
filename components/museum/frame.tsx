"use client";
import type { ReactNode } from "react";
import { OakMaterial, WallMaterial } from "./Materials";

/* A slim oak frame around a bevelled mat. Local +z faces the viewer. Children are the artwork, placed at the front of the mat. */
export function Frame({ aw, ah, mat = 0.14, children, position, rotation }: { aw: number; ah: number; mat?: number; children: ReactNode; position?: [number, number, number]; rotation?: [number, number, number] }) {
  const fw = 0.05, fd = 0.06, mw = aw + mat * 2, mh = ah + mat * 2;
  return (
    <group position={position} rotation={rotation}>
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
      <group position={[0, 0, 0.03]}>{children}</group>
    </group>
  );
}
