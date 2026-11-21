import type { Metadata, Viewport } from "next";
import { Source_Serif_4 } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { GeistPixelSquare } from "geist/font/pixel/square";
import "./globals.css";
import { profile } from "@/data/profile";

/* Same family as the reference site's type (Geist, Geist Mono, Geist Pixel) with a serif italic for a few words of emphasis. */
const serif = Source_Serif_4({ subsets: ["latin"], style: ["italic"], weight: ["400", "600"], variable: "--font-serif", display: "swap" });

const title = "Eryza Mae Imatong | Data Science, Analytics & Developer";
const site = "https://eryzaimatong.vercel.app";
export const metadata: Metadata = {
  metadataBase: new URL(site),
  title,
  description: profile.description,
  authors: [{ name: profile.name }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website", url: site, title,
    description: "BSIT (Data Science) student at PUP Manila. Recommendation systems, machine learning and software, with projects on GitHub.",
    images: [{ url: "/assets/og-image.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title, images: ["/assets/og-image.png"] },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/assets/favicon-32.png", sizes: "32x32", type: "image/png" }, { url: "/assets/icon-192.png", sizes: "192x192", type: "image/png" }], apple: "/assets/apple-touch-icon.png" },
  manifest: "/site.webmanifest",
};
export const viewport: Viewport = { themeColor: "#0A0506", colorScheme: "dark" };

const jsonLd = {
  "@context": "https://schema.org", "@type": "Person", name: profile.name, url: site + "/", image: site + "/assets/eryza.png",
  jobTitle: "BS Information Technology student (Data Science)",
  alumniOf: { "@type": "CollegeOrUniversity", name: "Polytechnic University of the Philippines" },
  address: { "@type": "PostalAddress", addressLocality: "Manila", addressCountry: "PH" },
  sameAs: [profile.github, profile.linkedin],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable} ${GeistPixelSquare.variable} ${serif.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
