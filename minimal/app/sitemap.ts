import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://eryzaimatong.vercel.app/", changeFrequency: "monthly", priority: 1 }];
}
