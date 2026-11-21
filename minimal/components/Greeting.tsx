"use client";
import { useEffect, useRef, useState } from "react";

/* print("hello") -> SELECT 'hello' -> こんにちは, typed and erased with a blinking cursor. The server renders the first line in full,
   so there is text before any script runs and the box never changes size (it reserves the widest line). */
const LINES = ['print("hello")', "SELECT 'hello'", "こんにちは"];

export function Greeting() {
  const [text, setText] = useState(LINES[0]);
  const box = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;   // the instant version: the first line, still
    let i = 0, n = LINES[0].length, mode: "hold" | "erase" | "type" = "hold", timer = 0, visible = true;
    const tick = () => {
      timer = 0;
      if (!visible || document.hidden) { timer = window.setTimeout(tick, 400); return; }       // nothing runs while it is off screen or the tab is hidden
      let wait = 60;
      if (mode === "hold") { mode = "erase"; wait = 30; }
      else if (mode === "erase") {
        n--; setText(LINES[i].slice(0, Math.max(0, n)));
        if (n <= 0) { i = (i + 1) % LINES.length; mode = "type"; wait = 260; } else wait = 28;
      } else {
        n++; setText(LINES[i].slice(0, n));
        if (n >= LINES[i].length) { mode = "hold"; wait = 1900; } else wait = 62 + Math.random() * 40;
      }
      timer = window.setTimeout(tick, wait);
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.1 });
    if (box.current) io.observe(box.current);
    timer = window.setTimeout(tick, 2400);
    return () => { clearTimeout(timer); io.disconnect(); };
  }, []);

  return (
    <p ref={box} className="greet mono">
      <span className="sr-only">hello</span>
      <span aria-hidden="true" className="greet-line"><span className="greet-p">›</span><span className="greet-t">{text}</span><i className="greet-c" /></span>
    </p>
  );
}
