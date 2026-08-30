import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Sacramento } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// High-contrast editorial display: upright for the first half of the headline,
// italic for the second — the two-tone treatment from the brief.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["500", "700", "900"],
});

// Bitmap face for the word mark, self-hosted from public/assets.
const astheticPixel = localFont({
  src: "../../public/assets/AstheticPixelDemoRegular-2v148.otf",
  variable: "--font-pixel-face",
  display: "swap",
  weight: "400",
});

// Handwritten signature that runs ahead of the bitmap word.
const sacramento = Sacramento({
  variable: "--font-sacramento",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "A Glitch in the Matrix — Decoded",
  description:
    "Unpopular opinions and untold stories. Move your cursor and the picture fractures into glass where you look.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${astheticPixel.variable} ${sacramento.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
