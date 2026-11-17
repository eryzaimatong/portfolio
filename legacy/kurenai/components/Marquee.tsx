import { profile } from "@/data/profile";

/* Top ticker. Loops lines the site already shows: name, role, availability, location. */
export function Marquee() {
  const parts = [profile.name, profile.kicker, profile.availability, profile.location];
  const run = (aria: boolean) => (
    <div className="marquee-run" aria-hidden={aria || undefined}>
      {[...parts, ...parts].map((t, i) => (<span key={i}>{t}<i aria-hidden="true">／</i></span>))}
    </div>
  );
  return (
    <div className="marquee" role="region" aria-label="Eryza Mae Imatong, Data Science, Analytics & Developer. Open to internships. Manila, Philippines.">
      <div className="marquee-track">{run(false)}{run(true)}</div>
    </div>
  );
}
