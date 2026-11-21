import { profile } from "@/data/profile";

/* Two crossing tapes that scroll in opposite directions. Words come from the site itself (title, availability, place, projects). */
const WORDS = [...profile.kicker.split(/,\s*|\s*&\s*/), profile.availability, profile.location, "Re:Watch", "AURA"];

function Strip({ cls }: { cls: string }) {
  const row = WORDS.map((w) => <span key={w}>{w}<i>✦</i></span>);
  return <div className={`tape ${cls}`}><div className="tape-track">{row}{row}</div></div>;
}

export function Tape() {
  return <div className="tapes" aria-hidden="true"><Strip cls="a" /><Strip cls="b" /></div>;
}
