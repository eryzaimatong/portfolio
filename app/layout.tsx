import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Figtree, DM_Mono } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/Shell";
import { profile } from "@/data/profile";

/* Fonts live here only: change these three lines to try another pairing. Display = condensed title-card type, body = friendly and easy to read. */
const display = Big_Shoulders({ subsets: ["latin"], weight: ["600", "700", "800", "900"], variable: "--font-display", display: "swap" });
const body = Figtree({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body", display: "swap" });
const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

const title = "Eryza Mae Imatong | Data Science, Analytics & Developer";
export const metadata: Metadata = {
  metadataBase: new URL(profile.url),
  title,
  description: profile.description,
  authors: [{ name: profile.name }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website", url: profile.url, title,
    description: "BSIT (Data Science) student at PUP Manila. Recommendation systems, machine learning and software, with projects on GitHub.",
    images: [{ url: "/assets/og-image.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title, images: ["/assets/og-image.png"] },
  icons: { icon: [{ url: "/assets/favicon-32.png", sizes: "32x32" }, { url: "/assets/icon-192.png", sizes: "192x192" }], apple: "/assets/apple-touch-icon.png" },
  manifest: "/site.webmanifest",
};
export const viewport: Viewport = { themeColor: "#0A0608", colorScheme: "dark" };

const jsonLd = {
  "@context": "https://schema.org", "@type": "Person", name: profile.name, url: profile.url + "/", image: profile.url + "/assets/eryza.png",
  jobTitle: "BS Information Technology student (Data Science)",
  alumniOf: { "@type": "CollegeOrUniversity", name: "Polytechnic University of the Philippines" },
  address: { "@type": "PostalAddress", addressLocality: "Manila", addressCountry: "PH" },
  sameAs: [profile.github, profile.linkedin],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try{if(sessionStorage.getItem('kn-seen'))document.documentElement.dataset.seen='1'}catch(e){}" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
