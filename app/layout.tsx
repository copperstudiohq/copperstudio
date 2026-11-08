import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://copperstudio.nl"),
  alternates: { canonical: "/" },
  title: "Copperstudio Games — Croba Planet, Rain & Copper, and The Card Game",
  description: "Explore Croba Planet, wander the Rain & Copper island, or take a seat for Rain & Copper: The Card Game. Three browser games, one little collection.",
  openGraph: {
    url: "/",
    title: "Copperstudio Games — Small games. Strange worlds.",
    description: "An alien glacier, a rain-soaked island, or a creature card duel? Find your next game at Copperstudio Games.",
    type: "website",
  },
  icons: { icon: "/copper-c.svg", shortcut: "/copper-c.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
