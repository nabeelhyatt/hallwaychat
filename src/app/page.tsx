"use client";

import { SearchBar } from "@/components/search/SearchBar";
import { ClipCard } from "@/components/clips/ClipCard";
import { TopicBadge } from "@/components/topics/TopicBadge";
import { Mic2, Sparkles } from "lucide-react";

// Placeholder data until Convex is connected
const PLACEHOLDER_CLIPS = [
  {
    _id: "1",
    title: "Why AI Agents Need Memory to Be Useful",
    summary: "Discussion on why memory is the missing piece for AI assistants",
    keyQuote: "Without memory, every conversation starts from zero",
    duration: 245,
    topics: ["ai-agents", "product-design", "memory"],
    aiEra: "gpt-4-era",
    episode: { title: "Memory, Context, and Product Design", episodeNumber: 38 },
  },
  {
    _id: "2",
    title: "The Future of Vibe Coding",
    summary: "How natural language programming is changing software development",
    keyQuote: "It's not about writing less code, it's about thinking at a higher level",
    duration: 312,
    topics: ["vibe-coding", "ai-development", "future-of-work"],
    aiEra: "claude-3-era",
    episode: { title: "Building Open World AI", episodeNumber: 37 },
    guestName: "Andrew Mason",
  },
  {
    _id: "3",
    title: "Ubiquity Over Ownership in AI",
    summary: "Why the best AI strategy might be everywhere, not exclusive",
    keyQuote: "Be water - flow into every container",
    duration: 189,
    topics: ["ai-strategy", "startup-advice", "distribution"],
    episode: { title: "Be Water, Ubiquity over Ownership", episodeNumber: 38 },
  },
];

const PLACEHOLDER_TOPICS = [
  { name: "AI Strategy", count: 24 },
  { name: "Product Design", count: 18 },
  { name: "Fundraising", count: 15 },
  { name: "Vibe Coding", count: 12 },
  { name: "AI Agents", count: 11 },
  { name: "Startup Advice", count: 9 },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16 md:py-24">
          {/* Logo/Brand */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-primary">
              <Mic2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Hallway Chat
            </h1>
          </div>

          {/* Tagline */}
          <p className="text-center text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Search 39+ episodes by concept, not chronology.
            <br />
            <span className="text-sm">
              Fraser &amp; Nabeel on AI, startups, and building great products.
            </span>
          </p>

          {/* Search Bar */}
          <SearchBar />

          {/* Topic Cloud */}
          <div className="flex flex-wrap justify-center gap-2 mt-8 max-w-2xl mx-auto">
            {PLACEHOLDER_TOPICS.map((topic) => (
              <TopicBadge
                key={topic.name}
                topic={topic.name}
                count={topic.count}
                size="md"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Clips Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold">Featured Clips</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLACEHOLDER_CLIPS.map((clip) => (
            <ClipCard key={clip._id} clip={clip} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm">
            Connect Convex to see real clips from the podcast
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Mic2 className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Hallway Chat &copy; 2025
              </span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a
                href="https://open.spotify.com/show/0uFogkRnawITZOlIZ34h70"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Spotify
              </a>
              <a
                href="https://podcasts.apple.com/us/podcast/hallway-chat/id1090529645"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Apple Podcasts
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
