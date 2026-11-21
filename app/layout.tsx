import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://copperstudio.nl"),
  alternates: { canonical: "/" },
  title: "Copperstudio Games — Six strange worlds to explore",
  description: "Explore Croba Planet, wander the Rain & Copper island, duel at the card table, enter Rain Arena of Copper, shape Mosswake Creek, or escape Blackroot Vale. Six browser games, one little collection.",
  openGraph: {
    url: "/",
    title: "Copperstudio Games — Small games. Strange worlds.",
    description: "An alien glacier, a rainy island, a card duel, sword combat, a pixel sandbox or the dark forests of Blackroot Vale? Find your next game at Copperstudio Games.",
    type: "website",
  },
  icons: { icon: "/copper-c.svg", shortcut: "/copper-c.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
