/* Project data. Every string below is carried over verbatim from the existing portfolio (dialogs.js). */
export type Project = {
  slug: string;
  title: string;
  tagline: string;
  year: number;
  role: string;
  stack: string[];
  cover: string;
  metrics?: { label: string; value: string }[];
  links?: { github?: string; demo?: string };
  body: { problem: string; approach: string; outcome: string };
  /* fields the existing site also has for each project */
  eyebrow: string;
  timeline: string;
  status: string;
  note?: string;
  decisions: string[];
  logo: { src: string; alt: string; bg: string };
  gallery: { src: string; caption: string }[];
  galleryNote: string;
  galleryRatio: [number, number];
  next: string;
};

export const projects: Project[] = [
  {
    slug: "rewatch",
    title: "Re:Watch",
    tagline:
      "Finds movies, TV, anime and K-drama by how you want to feel. Match scores come from a taste model I built, and every score lists the reasons that add up to it.",
    year: 2026,
    role: "Solo project",
    stack: ["React", "Java", "Spring Boot", "PostgreSQL", "Flyway", "Playwright", "Vercel", "Render", "Neon"],
    cover: "/assets/projects/rewatch-01-home.jpg",
    metrics: [
      { value: "10", label: "taste traits in every profile" },
      { value: "3", label: "hosted services: Vercel, Render and Neon" },
      { value: "200", label: "randomized trials in the test that checks every score equals the sum of its reasons" },
    ],
    links: { github: "https://github.com/eryzaimatong/rewatch", demo: "https://rewatch-stories.vercel.app" },
    body: {
      problem:
        "Recommenders usually rank by genre and popularity, so two titles with the same tag can feel nothing alike. Re:Watch is for people who scroll longer than they watch, and for groups choosing something together.",
      approach:
        "Each title and each person is a ten-trait vector (family, nostalgia, pacing, humor, comfort and others). A title's vector is derived from TMDB genres and a keyword lexicon I wrote by hand. A person's profile is rebuilt by replaying their rating history, and a match score is the sum of per-trait contributions, so the reasons always add up to the number shown. Movie Night lets friends answer five questions on their own phones and ranks titles so agreement beats one strong veto.",
      outcome:
        "Built and deployed: everything described above. Limits: the keyword lexicon is hand-written, not learned. Not done yet: an offline evaluation of the recommendations against held-out ratings, so I make no accuracy claim.",
    },
    eyebrow: "Project 01 // Recommender · Web app",
    timeline: "Jul 2026 to present",
    status: "Deployed",
    note: "The free-tier backend sleeps when idle, so the first load can take a couple of minutes.",
    decisions: [
      "Replay, not mutation: rebuilding the profile from the rating log makes re-rating and lexicon changes safe, and produces the taste-evolution timeline for free.",
      "Fixed scoring constants: a title shows the same percentage everywhere and does not drift when other titles are added.",
      'Contributions can go negative, so "tensions" are real, and rounding keeps the printed parts summing to the whole.',
      "Backend: Spring Boot, stateless JWT, Flyway migrations. Checks: JUnit, Playwright and axe-core accessibility audits, run in CI.",
    ],
    logo: { src: "/assets/projects/rewatch-logo.png", alt: "Re:Watch logo", bg: "#101b33" },
    gallery: [
      { src: "/assets/projects/rewatch-01-home.jpg", caption: "Home with a match score" },
      { src: "/assets/projects/rewatch-02-moods.jpg", caption: "Mood picker" },
      { src: "/assets/projects/rewatch-03-match.jpg", caption: "A match explained trait by trait" },
      { src: "/assets/projects/rewatch-04-taste-dna.jpg", caption: "Taste DNA profile" },
      { src: "/assets/projects/rewatch-05-movie-night.jpg", caption: "Movie Night group results" },
      { src: "/assets/projects/rewatch-06-community.jpg", caption: "Community and similar taste" },
    ],
    galleryNote: "Screens from the running app. Poster art is a generated placeholder.",
    galleryRatio: [1000, 625],
    next: "aura",
  },
  {
    slug: "aura",
    title: "AURA",
    tagline:
      "A mobile app (in development) that reads a selfie on your phone to estimate face shape and colour season, then suggests makeup and outfits from your own wardrobe.",
    year: 2026,
    role: "Personal project",
    stack: [
      "React", "TypeScript", "Vite", "Tailwind CSS", "Capacitor", "FastAPI", "Python", "scikit-learn", "MediaPipe", "Supabase", "Figma",
    ],
    cover: "/assets/projects/aura-01-welcome.png",
    metrics: [
      { value: "57.3%", label: "held-out accuracy of the face-shape model (839 images, 5 classes)" },
      { value: "21.6 pts", label: "accuracy gap across skin-tone bands, against my 5-point limit" },
      { value: "4,146", label: "usable images out of 5,000 measured" },
    ],
    links: { github: "https://github.com/eryzaimatong/aura" },
    body: {
      problem:
        "Online style advice is generic, and many apps send your photo to a server. AURA works from your own features and keeps the selfie on the device.",
      approach:
        "MediaPipe runs on the phone and reduces the selfie to a few numbers: five face ratios, colour values, a skin-tone band and a lighting score. Only those numbers reach a FastAPI backend, which stores them in Supabase with row-level security. A scikit-learn random forest estimates face shape, and the code includes a CLIP-based garment tagger for the wardrobe. The React app is wrapped for Android with Capacitor.",
      outcome:
        "Built in code: the scan pipeline, wardrobe, outfits and wear log. In development: improving the face-shape model so it passes the fairness gate. Not done: the Google Play launch.",
    },
    eyebrow: "Project 02 // Mobile · In development",
    timeline: "Oct 2026 to present",
    status: "In development, launch not cleared",
    decisions: [
      "Privacy by design: there is no image column, the API rejects extra fields, and consent is logged before the camera opens.",
      "Fairness gate: the model is blocked from launch until accuracy is within 5 points across skin-tone bands. It currently fails, and I report that.",
      "Honest outputs: confidence is always shown, and low colour confidence leads to a short quiz instead of a guess.",
    ],
    logo: { src: "/assets/projects/aura-logo.png", alt: "AURA logo: Mira, the mirror ghost", bg: "#fdf6ec" },
    gallery: [
      { src: "/assets/projects/aura-01-welcome.png", caption: "Welcome" },
      { src: "/assets/projects/aura-02-card.png", caption: "Your Aura Card" },
      { src: "/assets/projects/aura-03-for-you.png", caption: "Makeup picks" },
      { src: "/assets/projects/aura-04-closet.png", caption: "The Closet" },
      { src: "/assets/projects/aura-05-privacy.png", caption: "Data and privacy" },
    ],
    galleryNote: "Design mock-ups of the screens from the AURA repository. The app is still in development.",
    galleryRatio: [390, 844],
    next: "rewatch",
  },
];

export const bySlug = (slug: string) => projects.find((p) => p.slug === slug);

/* A "scene" is one real screen from a project's gallery, in order. The Project Wall shows scenes. */
export type Scene = { n: number; project: Project; src: string; caption: string; ratio: [number, number] };
export const scenes: Scene[] = projects.flatMap((p) => p.gallery.map((g) => ({ project: p, src: g.src, caption: g.caption, ratio: p.galleryRatio }))).map((s, i) => ({ ...s, n: i + 1 }));
