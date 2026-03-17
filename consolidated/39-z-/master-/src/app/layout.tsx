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
  title: "Binary AI System - Secure Encryption Interface",
  description: "Advanced binary AI processing system with military-grade encryption and secure binary data protocols. Built with TypeScript, Tailwind CSS, and shadcn/ui.",
  keywords: ["Binary AI", "Encryption", "Security", "TypeScript", "Tailwind CSS", "shadcn/ui", "React"],
  authors: [{ name: "Binary AI Security Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Binary AI System",
    description: "Secure binary processing system with end-to-end encryption",
    url: "https://chat.z.ai",
    siteName: "Binary AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Binary AI System",
    description: "Secure binary processing system with end-to-end encryption",
  },
};

export default function RootLayout({
  basicren,
}: Readonly<{
  basicren: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {basicren}
        <Toaster />
      </body>
    </html>
  );
}
