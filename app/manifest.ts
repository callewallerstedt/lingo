import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NeoLingo — Svenska för Tiffy",
    short_name: "NeoLingo",
    description: "Learn Swedish from scratch to fluent: lessons, flashcards, grammar and an AI tutor.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#006AA7",
    theme_color: "#006AA7",
    lang: "de",
    categories: ["education"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Flashcards", short_name: "Cards", url: "/?tab=cards" },
      { name: "Lektion", short_name: "Lektion", url: "/?tab=course" },
      { name: "AI-chatt", short_name: "Chatt", url: "/?tab=chat" },
    ],
  };
}
