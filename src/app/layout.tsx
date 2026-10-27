import type { Metadata, Viewport } from "next";
import { Jersey_10, Pixelify_Sans } from "next/font/google";
import "./globals.css";

// Jersey 10 for the crest, Pixelify Sans for everything the player reads.
const display = Jersey_10({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const ui = Pixelify_Sans({
  variable: "--font-ui",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sanity Winter Quest",
  description: "Et pikselkunst-rollespill og en julekalender for å lære Sanity.",
};

export const viewport: Viewport = {
  themeColor: "#262b44",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="nb" className={`${display.variable} ${ui.variable}`}>
      <body>{children}</body>
    </html>
  );
}
