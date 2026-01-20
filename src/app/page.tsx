"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SearchBar } from "@/components/search/SearchBar";
import { ClipCard } from "@/components/clips/ClipCard";
import { TopicBadge } from "@/components/topics/TopicBadge";
import { useConvexAvailable } from "@/components/providers/ConvexClientProvider";
import { Mic2, Sparkles } from "lucide-react";

// Separate component that uses Convex hooks - only rendered when Convex is available
function ChaptersContent() {
  const chapters = useQuery(api.chapters.listRecentWithEpisodes);
  const isLoading = chapters === undefined;

  // Client-side tag aggregation from chapter semantic tags
  const topics = useMemo(() => {
    if (!chapters) return [];
    const counts: Record<string, number> = {};
    chapters.forEach((ch) =>
      (ch.semanticTags ?? []).forEach((tag) => {
        counts[tag] = (counts[tag] ?? 0) + 1;
      })
    );
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }, [chapters]);

  // Transform chapter data to ClipCard format
  const clips = chapters?.map((ch) => ({
    _id: ch._id,
    title: ch.title,
    summary: ch.summary ?? "",
    duration: ch.duration,
    topics: ch.semanticTags ?? [],
    guestName: ch.episode?.guestName,
    episode: ch.episode
      ? {
          title: ch.episode.title,
          episodeNumber: ch.episode.episodeNumber,
        }
      : null,
  }));

  return (
    <>
      {/* Topic Cloud */}
      <div className="flex flex-wrap justify-center gap-2 mt-8 max-w-2xl mx-auto">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-7 w-20 bg-muted animate-pulse rounded-full"
            />
          ))
        ) : topics.length > 0 ? (
          topics.map((topic) => (
            <TopicBadge
              key={topic.name}
              topic={topic.name}
              count={topic.count}
              size="md"
            />
          ))
        ) : null}
      </div>

      {/* Featured Clips Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold">Featured Chapters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-64 bg-muted animate-pulse rounded-lg"
              />
            ))
          ) : clips?.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground py-12">
              Processing chapters... Check back soon!
            </p>
          ) : (
            clips?.map((clip) => <ClipCard key={clip._id} clip={clip} />)
          )}
        </div>
      </section>
    </>
  );
}

// Wrapper that checks for Convex availability
function ConvexContent() {
  const isAvailable = useConvexAvailable();

  if (!isAvailable) {
    // Convex not configured - show placeholder
    return (
      <>
        <div className="flex flex-wrap justify-center gap-2 mt-8 max-w-2xl mx-auto">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-7 w-20 bg-muted animate-pulse rounded-full"
            />
          ))}
        </div>
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold">Featured Chapters</h2>
          </div>
          <p className="text-center text-muted-foreground py-12">
            Connect Convex to see chapters.
          </p>
        </section>
      </>
    );
  }

  return <ChaptersContent />;
}

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
        </div>
      </section>

      {/* Dynamic content - handles Convex availability */}
      <ConvexContent />

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
