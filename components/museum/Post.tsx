"use client";
import { EffectComposer, N8AO, Bloom, Vignette, Noise, ToneMapping, SMAA, ChromaticAberration } from "@react-three/postprocessing";
import { ToneMappingMode, BlendFunction } from "postprocessing";
import * as THREE from "three";
import { useStore } from "@/lib/store";

/* Restrained: ambient occlusion, bloom only on true light sources (high threshold), vignette, fine grain, ACES. Nothing that reads as a filter. */
export function Post() {
  const tier = useStore((s) => s.tier);
  const high = tier === "high";
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {high ? <N8AO aoRadius={1.1} distanceFalloff={1.4} intensity={2.4} quality="medium" halfRes /> : <></>}
      <Bloom luminanceThreshold={0.95} luminanceSmoothing={0.15} intensity={0.22} mipmapBlur />
      {high ? <ChromaticAberration offset={new THREE.Vector2(0.0005, 0.0005)} radialModulation modulationOffset={0.6} /> : <></>}
      <Vignette eskil={false} offset={0.28} darkness={0.7} />
      <Noise opacity={0.035} blendFunction={BlendFunction.SOFT_LIGHT} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <SMAA />
    </EffectComposer>
  );
}
