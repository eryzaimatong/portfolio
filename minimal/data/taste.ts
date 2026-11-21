/* DEMO DATA for the Taste DNA exhibit. The ten traits are Re:Watch's. The 40 titles and their vectors below are sample
   numbers I wrote for this demo to show the idea. They are NOT Re:Watch's catalogue or its real output. */

export const TRAITS = [
  "Comfort & Warmth", "Nostalgia & Memory", "Character Growth", "Slow Burn Pacing", "Humor & Lightheartedness",
  "Romance", "Emotional Intensity", "Hopeful Payoff", "Bittersweet Drama", "Found Family",
] as const;
export const SHORT = ["Comfort", "Nostalgia", "Growth", "Slow burn", "Humor", "Romance", "Intensity", "Hopeful", "Bittersweet", "Found family"];

export type Kind = "Movie" | "TV" | "Anime" | "K-drama";
/* trait order matches TRAITS, each 0 to 9 */
const RAW: [string, Kind, string][] = [
  ["Spirited Away", "Anime", "7657525846"], ["Your Name", "Anime", "5765488783"], ["My Neighbor Totoro", "Anime", "9856602827"],
  ["Howl's Moving Castle", "Anime", "7575685838"], ["Violet Evergarden", "Anime", "5688269794"], ["Fruits Basket", "Anime", "7595677879"],
  ["Clannad", "Anime", "7786679989"], ["A Silent Voice", "Anime", "4596269883"], ["Weathering With You", "Anime", "5565487675"],
  ["Barakamon", "Anime", "9586913827"], ["Whisper of the Heart", "Anime", "7786576959"], ["Kiki's Delivery Service", "Anime", "8685620936"],
  ["Crash Landing on You", "K-drama", "6465797866"], ["Reply 1988", "K-drama", "9987847979"], ["Goblin", "K-drama", "5676688795"],
  ["Hospital Playlist", "K-drama", "9687834849"], ["My Mister", "K-drama", "5599219697"], ["Extraordinary Attorney Woo", "K-drama", "7396855957"],
  ["Our Beloved Summer", "K-drama", "7787687785"], ["When the Camellia Blooms", "K-drama", "6476588878"],
  ["Coco", "Movie", "6975638989"], ["Paddington 2", "Movie", "9435903919"], ["Little Women (2019)", "Movie", "7897567789"],
  ["The Princess Bride", "Movie", "7654975937"], ["About Time", "Movie", "8776697976"], ["Eternal Sunshine of the Spotless Mind", "Movie", "3768589591"],
  ["Lost in Translation", "Movie", "4596345463"], ["Soul", "Movie", "6585627955"], ["The Perks of Being a Wallflower", "Movie", "4786478788"],
  ["The Secret Life of Walter Mitty", "Movie", "7486656934"],
  ["Ted Lasso", "TV", "9496936949"], ["Gilmore Girls", "TV", "9876885858"], ["Parks and Recreation", "TV", "9575936939"],
  ["Schitt's Creek", "TV", "8495985949"], ["The Bear", "TV", "3486449687"], ["Fleabag", "TV", "3386879593"],
  ["Avatar: The Last Airbender", "TV", "7795767969"], ["Stranger Things", "TV", "5856648769"], ["Heartstopper", "TV", "8486796948"],
  ["Normal People", "TV", "3579299592"],
];
export const TITLES = RAW.map(([title, kind, v]) => ({ title, kind, v: [...v].map(Number) }));

export const PRESETS: { label: string; v: number[] }[] = [
  { label: "Cozy night", v: [9, 4, 5, 3, 7, 4, 2, 9, 1, 8] },
  { label: "Slow and bittersweet", v: [3, 7, 8, 9, 1, 5, 8, 4, 9, 4] },
  { label: "Laugh and fall in love", v: [7, 3, 4, 3, 9, 9, 3, 9, 2, 5] },
];

const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
const norm = (a: number[]) => Math.sqrt(dot(a, a));

/* cosine similarity between the dialled-in profile and each title; returns the three closest */
export function topThree(profile: number[]) {
  const n = norm(profile);
  if (n === 0) return [];
  return TITLES.map((t) => ({ ...t, score: dot(profile, t.v) / (n * norm(t.v)) })).sort((a, b) => b.score - a.score).slice(0, 3);
}
