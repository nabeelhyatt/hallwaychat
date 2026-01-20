import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { AudioPlayerProvider } from "@/components/providers/AudioPlayerProvider";
import { FloatingPlayer } from "@/components/player/FloatingPlayer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hallway Chat - Search Podcast Clips by Concept",
  description:
    "Search 39+ episodes of Hallway Chat by concept, not chronology. Fraser and Nabeel discuss AI, startups, and product development.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConvexClientProvider>
          <AudioPlayerProvider>
            {children}
            <FloatingPlayer />
          </AudioPlayerProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
