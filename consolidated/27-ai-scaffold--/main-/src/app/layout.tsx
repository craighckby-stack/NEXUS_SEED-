import type { Metadata } from "next";
import { fontInter } from "next/font/google";
import "./globals.css";

const inter = fontInter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "OMEGA - Omni-Model Emergent General Intelligence Architecture",
  description:
    "A unified AI system synthesizing consciousness, reasoning, memory, agent swarms, security, and self-improvement.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`h-screen ${inter.className} flex flex-col justify-center items-center`}
      >
        {children}
      </body>
    </html>
  );
}