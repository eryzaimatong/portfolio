"use client";
import { useEffect, useRef, useState } from "react";

/* Background music, off by default. Nothing is downloaded: a quiet lo-fi beat is synthesised live with Web Audio
   (84 BPM, A minor: Am, F, C, G), so there are no audio files and no licensing questions. It fades in and out,
   and pauses whenever the tab is hidden. */

const BPM = 84, STEP = 60 / BPM / 4;                                   // sixteenth notes
const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];  // Am F C G
const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

class Beat {
  ctx = new AudioContext();
  out = this.ctx.createGain();
  noise: AudioBuffer;
  step = 0; next = 0; timer = 0;
  constructor() {
    const warm = this.ctx.createBiquadFilter(); warm.type = "lowpass"; warm.frequency.value = 3600;
    this.out.gain.value = 0; this.out.connect(warm).connect(this.ctx.destination);
    this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }
  kick(t: number) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    this.env(g, t, 0.9, 0.004, 0.32); o.connect(g).connect(this.out); o.start(t); o.stop(t + 0.4);
  }
  hiss(t: number, type: BiquadFilterType, freq: number, peak: number, decay: number) {
    const s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    s.buffer = this.noise; f.type = type; f.frequency.value = freq;
    this.env(g, t, peak, 0.002, decay); s.connect(f).connect(g).connect(this.out); s.start(t, Math.random() * 0.5); s.stop(t + decay + 0.05);
  }
  tone(t: number, m: number, type: OscillatorType, peak: number, attack: number, decay: number, detune = 0) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain(), f = this.ctx.createBiquadFilter();
    o.type = type; o.frequency.value = hz(m); o.detune.value = detune; f.type = "lowpass"; f.frequency.value = 900;
    this.env(g, t, peak, attack, decay); o.connect(f).connect(g).connect(this.out); o.start(t); o.stop(t + attack + decay + 0.05);
  }
  schedule(s: number, t: number) {
    const i = s % 16, chord = CHORDS[Math.floor(s / 32) % 4];        // a chord every two bars
    if (i === 0 || i === 7 || i === 10) this.kick(t);
    if (i === 4 || i === 12) this.hiss(t, "lowpass", 1800, 0.22, 0.18); // soft clap
    if (i % 2 === 0) this.hiss(t, "highpass", 7000, i % 4 === 2 ? 0.07 : 0.04, i === 14 ? 0.12 : 0.04);
    if (i === 0 || i === 10) this.tone(t, chord[0] - 24, "sine", 0.32, 0.01, 0.7);
    if (s % 32 === 0) chord.forEach((m, k) => { this.tone(t, m, "sawtooth", 0.035, 0.6, STEP * 30, -6 + k * 5); this.tone(t, m + 12, "triangle", 0.02, 0.8, STEP * 28, 4); });
    if (i === 6 || i === 14) this.tone(t, chord[(s >> 4) % 3] + 12, "triangle", 0.03, 0.01, 0.35); // a small keys motif
  }
  start() {
    this.ctx.resume(); this.next = this.ctx.currentTime + 0.08;
    this.out.gain.cancelScheduledValues(this.ctx.currentTime); this.out.gain.setTargetAtTime(0.22, this.ctx.currentTime, 0.5);
    const tick = () => { while (this.next < this.ctx.currentTime + 0.15) { this.schedule(this.step++, this.next); this.next += STEP; } };
    tick(); this.timer = window.setInterval(tick, 30);
  }
  stop() {
    this.out.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25);
    window.setTimeout(() => { clearInterval(this.timer); this.ctx.suspend(); }, 900);
  }
}

export function SoundToggle() {
  const [on, setOn] = useState(false);
  const beat = useRef<Beat | null>(null);
  useEffect(() => {
    const vis = () => { const b = beat.current; if (!b || !on) return; if (document.hidden) b.ctx.suspend(); else b.ctx.resume(); };
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, [on]);
  useEffect(() => () => { beat.current?.ctx.close(); }, []);
  const toggle = () => {
    if (!beat.current) beat.current = new Beat();
    if (on) beat.current.stop(); else beat.current.start();
    setOn(!on);
  };
  return (
    <button type="button" className={"sound" + (on ? " on" : "")} onClick={toggle} aria-pressed={on} aria-label={on ? "Turn the background music off" : "Turn the background music on"} title={on ? "Music on" : "Music off"}>
      <i /><i /><i /><i />
    </button>
  );
}
