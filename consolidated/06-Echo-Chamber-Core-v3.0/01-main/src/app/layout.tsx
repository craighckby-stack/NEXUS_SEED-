import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ECHO CHAMBER CORE v3.0 - Recurrent Summarization Engine",
  description: "Advanced AI debate system with recurrent summarization for efficient context management and multi-agent discussions.",
  keywords: ["AI", "Debate", "Multi-Agent", "Summarization", "Echo Chamber", "Context Management", "AI Discussion"],
  authors: [{ name: "ECHO CHAMBER Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "ECHO CHAMBER CORE v3.0",
    description: "Advanced AI debate system with recurrent summarization",
    url: "https://localhost:3000",
    siteName: "Echo Chamber",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ECHO CHAMBER CORE v3.0",
    description: "Advanced AI debate system with recurrent summarization",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
