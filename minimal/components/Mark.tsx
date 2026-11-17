/* The site mark: a pixel "EI" (Eryza Imatong) with a blood-red cursor block. Same drawing as app/icon.svg. */
const E = ["XXXXX", "X....", "X....", "XXXX.", "X....", "X....", "XXXXX"];
const I = ["XXX", ".X.", ".X.", ".X.", ".X.", ".X.", "XXX"];

export function Mark({ size = 28 }: { size?: number }) {
  const px = 4, ox = 8, oy = 18;
  const cells: { x: number; y: number; red?: boolean }[] = [];
  E.forEach((row, r) => [...row].forEach((ch, c) => ch === "X" && cells.push({ x: ox + c * px, y: oy + r * px })));
  I.forEach((row, r) => [...row].forEach((ch, c) => ch === "X" && cells.push({ x: ox + (6 + c) * px, y: oy + r * px })));
  [10, 11].forEach((c) => cells.push({ x: ox + c * px, y: oy + 6 * px, red: true }));
  return (
    <svg className="mark" viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="12" fill="#0A0506" />
      <rect x="0.5" y="0.5" width="63" height="63" rx="11.5" fill="none" stroke="#3a1a1f" />
      {cells.map((c, i) => (<rect key={i} x={c.x} y={c.y} width={px} height={px} fill={c.red ? "#E0112B" : "#F1ECEC"} className={c.red ? "mark-cursor" : undefined} />))}
    </svg>
  );
}
