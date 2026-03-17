import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

// --- Font Loading ---

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// --- Metadata Constants ---

const SITE_NAME = "Z.ai";
const DEFAULT_TITLE = "Z.ai Code Scaffold - AI-Powered Development";
const DEFAULT_DESCRIPTION = "Modern Next.js scaffold optimized for AI-powered development with Z.ai. Built with TypeScript, Tailwind CSS, and shadcn/ui.";
const SITE_URL = "https://chat.z.ai";
const ICON_URL = "https://z-cdn.chatglm.cn/z-ai/static/logo.svg";

// --- Metadata Configuration ---

export const metadata: Metadata = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  keywords: ["Z.ai", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "AI development", "React"],
  authors: [{ name: "Z.ai Team" }],
  icons: {
    icon: ICON_URL,
  },
  openGraph: {
    title: "Z.ai Code Scaffold",
    description: "AI-powered development with modern React stack",
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Z.ai Code Scaffold",
    description: "AI-powered development with modern React stack",
  },
};

// --- Layout Component ---

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bodyClasses = `${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={bodyClasses}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}