import { Museum } from "@/components/museum/Museum";
import { LiteSite } from "@/components/lite/LiteSite";

export default function Home() {
  return (
    <main id="main">
      <Museum lite={<LiteSite />} />
    </main>
  );
}
