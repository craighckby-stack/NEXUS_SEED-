// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// Define font variables with descriptive names
const sansFont = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const monoFont = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Extract metadata into a separate function for better readability
function getMetadata(): Metadata {
  return {
    title: "Z.ai Code Scaffold - AI-Powered Development",
    description: "Modern Next.js scaffold optimized for AI-powered development with Z.ai. Built with TypeScript, Tailwind CSS, and shadcn/ui.",
    keywords: ["Z.ai", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "AI development", "React"],
    authors: [{ name: "Z.ai Team" }],
    icons: {
      icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
    },
    openGraph: {
      title: "Z.ai Code Scaffold",
      description: "AI-powered development with modern React stack",
      url: "https://chat.z.ai",
      siteName: "Z.ai",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Z.ai Code Scaffold",
      description: "AI-powered development with modern React stack",
    },
  };
}

// Define the RootLayout component with improved type annotations
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sansFont.variable} ${monoFont.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

// Export metadata using the getMetadata function
export const metadata: Metadata = getMetadata();