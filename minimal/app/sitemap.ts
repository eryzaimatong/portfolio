import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://eryzaimatong.vercel.app/", changeFrequency: "monthly", priority: 1 },
    { url: "https://eryzaimatong.vercel.app/skills", changeFrequency: "monthly", priority: 0.6 }];
}
