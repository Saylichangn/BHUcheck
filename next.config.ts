import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@node-rs/argon2",
    "@prisma/adapter-pg",
    "pdf-to-img",
    "pdfjs-dist",
    "pdfkit",
    "pg",
    "tesseract.js",
  ],
  outputFileTracingIncludes: {
    "/**": [
      "./node_modules/@fontsource/**/files/*.woff",
      "./node_modules/@fontsource/**/files/*.woff2",
      "./node_modules/@expo-google-fonts/**/*.ttf",
      "./node_modules/@tesseract.js-data/**/*",
    ],
  },
};

export default nextConfig;
