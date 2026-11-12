import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://copperstudio.nl"),
  alternates: { canonical: "/" },
  title: "Copperstudio Games — Croba Planet, Rain & Copper, The Card Game & Tri Arena",
  description: "Explore Croba Planet, wander the Rain & Copper island, duel at the card table, or enter Tri Arena. Four browser games, one little collection.",
  openGraph: {
    url: "/",
    title: "Copperstudio Games — Small games. Strange worlds.",
    description: "An alien glacier, a rain-soaked island, a creature card duel, or a sword fight in Tri Arena? Find your next game at Copperstudio Games.",
    type: "website",
  },
  icons: { icon: "/copper-c.svg", shortcut: "/copper-c.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
