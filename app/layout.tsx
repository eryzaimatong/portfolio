import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { profile } from "@/data/profile";

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
export const viewport: Viewport = { themeColor: "#0C0C0B", colorScheme: "dark" };

const jsonLd = {
  "@context": "https://schema.org", "@type": "Person", name: profile.name, url: profile.url + "/", image: profile.url + "/assets/eryza.png",
  jobTitle: "BS Information Technology student (Data Science)",
  alumniOf: { "@type": "CollegeOrUniversity", name: "Polytechnic University of the Philippines" },
  address: { "@type": "PostalAddress", addressLocality: "Manila", addressCountry: "PH" },
  sameAs: [profile.github, profile.linkedin],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /></head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
