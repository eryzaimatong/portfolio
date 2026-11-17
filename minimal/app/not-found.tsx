import Link from "next/link";
import { Mark } from "@/components/Mark";

export default function NotFound() {
  return (
    <main className="nf">
      <Mark size={44} />
      <h1 className="pixel">This page doesn’t exist</h1>
      <p className="dim">It may have moved, or it never existed.</p>
      <Link className="btn solid mono" href="/">Back to the portfolio</Link>
    </main>
  );
}
