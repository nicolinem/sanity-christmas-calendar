import type { Metadata, Viewport } from "next";
import {
  Chakra_Petch,
  Geist_Mono,
  Jersey_10,
  Pixelify_Sans,
} from "next/font/google";
import "./globals.css";

// Keep the pixel faces for game identity. UI text uses Chakra Petch: angular
// enough to feel like a game, plain enough for hints and lessons. Code stays mono.
const display = Jersey_10({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const ui = Chakra_Petch({
  variable: "--font-ui",
  weight: ["400", "500", "600", "700"],
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
  description:
    "En julekalender med små Sanity-oppgaver og et lite pikselspill som viser resultatet.",
};

export const viewport: Viewport = {
  themeColor: "#262b44",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="nb"
      className={`${display.variable} ${ui.variable} ${code.variable} ${pixel.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
