/* The walk. Room names and order are the live site's navigation (Home, About, Projects, Skills, Experience, Leadership, Contact).
   The camera travels down a straight spine (negative z). Each segment is a stretch of scroll (in screen-heights) mapped 1:1 to a stretch of z.
   Working museum labels: Welcome Hall, The Curator, The Exhibitions, Skills Hallway, Experience (alcoves), The Collection, The Future Wing. */
export const ROOM_NAMES = ["Home", "About", "Projects", "Skills", "Experience", "Leadership", "Contact"] as const;
export type RoomName = (typeof ROOM_NAMES)[number];
export const roomId = (n: RoomName) => n.toLowerCase();
export const BUILT: RoomName[] = [...ROOM_NAMES];

/* Geometry (metres), all along -z. */
export const HALL = { w: 9, l: 16, h: 5.6 };
export const CORR = { w: 3, h: 3.4 };
export const CORRIDORS: [number, number][] = [[-16, -22], [-36, -42.15], [-94.8, -103.2], [-116.8, -121]];   // ends overlap the round rooms a little so no crack shows
export const ABOUT = { z0: -22, z1: -36, w: 8, h: 4.8 };
export const PROJ = { zc: -50, r: 8, h: 5.6, door: 3 };
export const SKILLS = { z0: -57.9, z1: -88, w: 3, h: 3.8 };
export const EXP = { zc: -88, r: 7, h: 4.6, door: 3 };
export const LEAD = { zc: -110, r: 7, h: 5.4, door: 3 };
export const CONTACT = { z0: -121, z1: -135, w: 8, h: 4.6 };

export type Segment = { room: RoomName; vh: number; z0: number; z1: number };
export const SEGMENTS: Segment[] = [
  { room: "Home", vh: 100, z0: -1.2, z1: -14 },
  { room: "Home", vh: 40, z0: -14, z1: -22 },
  { room: "About", vh: 130, z0: -22, z1: -34 },
  { room: "About", vh: 35, z0: -34, z1: -42 },
  { room: "Projects", vh: 190, z0: -42, z1: -58 },
  { room: "Skills", vh: 230, z0: -58, z1: -88 },
  { room: "Experience", vh: 150, z0: -88, z1: -95 },
  { room: "Experience", vh: 30, z0: -95, z1: -103 },
  { room: "Leadership", vh: 150, z0: -103, z1: -117 },
  { room: "Contact", vh: 110, z0: -117, z1: -131 },
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

/* How many things can be picked in a room (steering and arrow keys). */
export const FOCUS_COUNT: Partial<Record<RoomName, number>> = { Projects: 2, Experience: 3, Leadership: 3 };
