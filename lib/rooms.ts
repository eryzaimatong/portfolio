/* The walk. Room names and order are the live site's navigation (Home, About, Projects, Skills, Experience, Leadership, Contact).
   The camera travels down a straight spine (negative z). Each segment is a stretch of scroll (in screen-heights) mapped 1:1 to a stretch of z. */
export const ROOM_NAMES = ["Home", "About", "Projects", "Skills", "Experience", "Leadership", "Contact"] as const;
export type RoomName = (typeof ROOM_NAMES)[number];
export const roomId = (n: RoomName) => n.toLowerCase();

/* Which rooms exist in 3D so far. The rest are reachable in the Lite layout only. */
export const BUILT: RoomName[] = ["Home", "Projects"];

export type Segment = { room: RoomName; vh: number; z0: number; z1: number };

/* Geometry (metres): Home hall z 0..-16, corridor -16..-26, Projects round room centred z=-34 with radius 8 (door to door -26..-42). */
export const HALL = { w: 9, l: 16, h: 5.6 };
export const CORRIDOR = { w: 3, l: 10, h: 3.4 };
export const PROJ = { zc: -34, r: 8, h: 5.6, door: 3 };

export const SEGMENTS: Segment[] = [
  { room: "Home", vh: 110, z0: -1.2, z1: -14 },
  { room: "Home", vh: 70, z0: -14, z1: -26 },
  { room: "Projects", vh: 230, z0: -26, z1: -40.4 },
];
export const TOTAL_VH = SEGMENTS.reduce((a, s) => a + s.vh, 0);

export const EYE = 1.6;

/* Scroll fraction t in [0,1] (over the scrollable range) -> camera z and the room it is in. */
export function pathAt(t: number) {
  const want = Math.min(Math.max(t, 0), 1) * TOTAL_VH;
  let acc = 0;
  for (const s of SEGMENTS) {
    if (want <= acc + s.vh || s === SEGMENTS[SEGMENTS.length - 1]) {
      const k = Math.min(Math.max((want - acc) / s.vh, 0), 1);
      return { z: s.z0 + (s.z1 - s.z0) * k, room: s.room };
    }
    acc += s.vh;
  }
  return { z: SEGMENTS[0].z0, room: "Home" as RoomName };
}

/* Scroll position (in screen-heights) at which a room starts. Used by the nav. */
export function roomStartVh(room: RoomName) {
  let acc = 0;
  for (const s of SEGMENTS) { if (s.room === room) return acc; acc += s.vh; }
  return null;
}
