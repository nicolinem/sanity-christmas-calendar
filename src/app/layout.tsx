import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Jersey_10, Pixelify_Sans } from "next/font/google";
import "./globals.css";

// Keep the pixel faces for game identity; use readable sans and mono for UI and code.
const display = Jersey_10({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const ui = Geist({
  variable: "--font-ui",
  subsets: ["latin"],
});

const code = Geist_Mono({
  variable: "--font-code",
  subsets: ["latin"],
});

const pixel = Pixelify_Sans({
  variable: "--font-pixel",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sanity-julekalenderen",
  description: "En julekalender med små Sanity-oppgaver og et lite pikselspill som viser resultatet.",
};

export const viewport: Viewport = {
  themeColor: "#262b44",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="nb" className={`${display.variable} ${ui.variable} ${code.variable} ${pixel.variable}`}>
      <body>{children}</body>
    </html>
  );
}
