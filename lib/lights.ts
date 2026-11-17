/* The light pool. Rooms do not own real lights; they register "anchors" (where light should come from) and "spot requests".
   A small fixed set of real lights (see LightPool) is moved to the nearest anchors every frame. The number of real lights never
   changes, so shaders compile once instead of once per room, and the GPU only ever evaluates a handful of lights per pixel. */
import * as THREE from "three";

export type Anchor = {
  id: number; pos: THREE.Vector3; quat: THREE.Quaternion; w: number; h: number; intensity: number; color: string;
  centre: number; reach: number;
};
export const anchors = new Map<number, Anchor>();

export type SpotReq = {
  id: number; pos: THREE.Vector3; target: THREE.Vector3; intensity: number; color: string;
  angle: number; penumbra: number; distance: number; centre: number; reach: number;
};
export const spots = new Map<number, SpotReq>();

let next = 1;
export const newId = () => next++;
