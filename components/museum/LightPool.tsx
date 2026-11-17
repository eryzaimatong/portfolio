"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { anchors, spots, newId, type SpotReq } from "@/lib/lights";
import { roomGain } from "./parts";
import { S } from "@/lib/store";

const K = 5;                                        // real area lights, ever
const ease = (cur: number, want: number, dt: number, rate = 9) => cur + (want - cur) * Math.min(1, dt * rate);

/* Five area lights and one shadow-casting spotlight exist for the whole museum. Each frame they move to the nearest registered
   anchors and fade over, so a room still looks lit by its own slits while the GPU only ever evaluates six lights. */
export function LightPool() {
  const rects = useRef<(THREE.RectAreaLight | null)[]>([]);
  const slot = useRef(Array.from({ length: K }, () => ({ id: -1, cur: 0 })));
  const spot = useRef<THREE.SpotLight>(null);
  const tgt = useRef<THREE.Object3D>(null);
  const sp = useRef({ id: -1, cur: 0 });
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame(({ camera }, dt) => {
    const cz = camera.position.z, cp = camera.position;
    // ---- area lights ----
    const ranked = [...anchors.values()]
      .map((a) => ({ a, g: roomGain(cz, a.centre, a.reach), d2: a.pos.distanceToSquared(cp) }))
      .map((o) => ({ ...o, score: (o.a.intensity * o.g) / (1 + o.d2 * 0.35) }))
      .sort((x, y) => y.score - x.score).slice(0, K);
    const want = new Map(ranked.map((o) => [o.a.id, o]));
    const taken = new Set(slot.current.filter((s) => want.has(s.id)).map((s) => s.id));
    const free = ranked.filter((o) => !taken.has(o.a.id));
    slot.current.forEach((s, i) => {
      const light = rects.current[i]; if (!light) return;
      let o = want.get(s.id);
      if (!o) {
        if (s.cur < 0.04 && free.length) { const n = free.shift()!; s.id = n.a.id; o = n; }
        else { s.cur = ease(s.cur, 0, dt); light.intensity = s.cur; return; }           // fade the old one out first
      }
      const a = o.a;
      light.position.copy(a.pos); light.quaternion.copy(a.quat);
      light.width = a.w; light.height = a.h; light.color.copy(tmp.set(a.color));
      s.cur = ease(s.cur, a.intensity * S.lights * o.g, dt);
      light.intensity = s.cur;
    });
    // ---- the one shadow-casting spotlight ----
    let best: SpotReq | null = null, bd = Infinity;
    spots.forEach((r) => { const d = Math.abs(cz - r.centre); if (d < r.reach + 6 && d < bd) { bd = d; best = r; } });
    const l = spot.current, st = sp.current;
    if (l) {
      const b = best as SpotReq | null;
      if (b && (b.id === st.id || st.cur < 0.04)) {
        st.id = b.id;
        l.position.copy(b.pos); if (tgt.current) { tgt.current.position.copy(b.target); tgt.current.updateMatrixWorld(); }
        l.angle = b.angle; l.penumbra = b.penumbra; l.distance = b.distance; l.color.copy(tmp.set(b.color));
        st.cur = ease(st.cur, b.intensity * S.lights * roomGain(cz, b.centre, b.reach), dt, 7);
      } else st.cur = ease(st.cur, 0, dt, 9);
      l.intensity = st.cur;
    }
  });

  return (
    <>
      {Array.from({ length: K }, (_, i) => (
        <rectAreaLight key={i} ref={(el) => { rects.current[i] = el; }} width={1} height={1} intensity={0} color="#ffd8aa" />
      ))}
      <spotLight ref={spot} intensity={0} castShadow decay={2} shadow-mapSize={[1024, 1024]} shadow-radius={6} shadow-bias={-0.0004} />
      <object3D ref={tgt} />
    </>
  );
}

/* A room asks for the shadow spot here; the returned object can be mutated every frame (moving lights). */
export function useSpotRequest(init: Omit<SpotReq, "id" | "pos" | "target"> & { pos: [number, number, number]; target: [number, number, number] }) {
  const req = useMemo<SpotReq>(() => ({ ...init, id: newId(), pos: new THREE.Vector3(...init.pos), target: new THREE.Vector3(...init.target) }), []);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { spots.set(req.id, req); return () => { spots.delete(req.id); }; }, [req]);
  return req;
}

/* A soft light shaft: an open cone with a view-edge falloff, a slow density wobble and additive blending. It is only the visible beam;
   the light itself comes from the pool. */
const vert = `varying float vY; varying vec3 vN; varying vec3 vV; varying float vA;
void main(){ vY = position.z; vA = atan(position.y, position.x); vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
const frag = `uniform float uOpacity; uniform float uTime; uniform vec3 uColor; varying float vY; varying vec3 vN; varying vec3 vV; varying float vA;
void main(){ float along = clamp(vY, 0., 1.);
  float edge = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
  float fall = pow(1. - along, 1.4) * smoothstep(0., .08, along);
  float wob = .86 + .14 * sin(along * 26. + vA * 5. + uTime * .35) * sin(vA * 3. - uTime * .22);
  gl_FragColor = vec4(uColor, uOpacity * edge * fall * wob); }`;
export function BeamCone({ req, radius = 1.2, opacity = 0.32 }: { req: SpotReq; radius?: number; opacity?: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const uni = useMemo(() => ({ uOpacity: { value: 0 }, uTime: { value: 0 }, uColor: { value: new THREE.Color(req.color) } }), [req]);
  const geo = useMemo(() => { const g = new THREE.CylinderGeometry(1, 0.06, 1, 48, 1, true); g.translate(0, 0.5, 0); g.rotateX(Math.PI / 2); return g; }, []);
  useFrame(({ camera, clock }) => {
    const m = mesh.current; if (!m) return;
    m.position.copy(req.pos);
    m.lookAt(req.target);
    const len = req.pos.distanceTo(req.target);
    m.scale.set(radius, radius, len);
    uni.uTime.value = clock.elapsedTime;
    uni.uOpacity.value = opacity * S.lights * roomGain(camera.position.z, req.centre, req.reach);
  });
  return (
    <mesh ref={mesh} geometry={geo} renderOrder={5} frustumCulled={false} userData={{ fixture: true }}>
      <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={uni} transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
    </mesh>
  );
}
