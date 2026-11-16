import type { NextConfig } from "next";

const config: NextConfig = {
  images: { formats: ["image/avif", "image/webp"] },
  reactStrictMode: true,
};
export default config;
