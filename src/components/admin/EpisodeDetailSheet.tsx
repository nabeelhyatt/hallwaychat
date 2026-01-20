"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

interface Episode {
  _id: Id<"episodes">;
  title: string;
  description?: string;
  episodeNumber: number;
  publishedAt: number;
  duration: number;
  audioUrl: string;
  thumbnailUrl?: string;
  guestName?: string;
  status: "draft" | "processing" | "published";
}

interface EpisodeDetailSheetProps {
  episode: Episode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function getUniqueSpeakers(segments: Array<{ speaker: string }>): string[] {
  return [...new Set(segments.map((s) => s.speaker))];
}

export function EpisodeDetailSheet({
  episode,
  open,
  onOpenChange,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: EpisodeDetailSheetProps) {
  // Fetch related data only when episode is selected AND sheet is open
  const chapters = useQuery(
    api.chapters.getByEpisode,
    episode && open ? { episodeId: episode._id } : "skip"
  );

  const clips = useQuery(
    api.clips.getByEpisode,
    episode && open ? { episodeId: episode._id } : "skip"
  );

  const segments = useQuery(
    api.transcriptImport.getEpisodeSegments,
    episode && open ? { episodeId: episode._id } : "skip"
  );

  if (!episode) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        {/* Header with navigation */}
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onPrevious}
                disabled={!hasPrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onNext}
                disabled={!hasNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Badge
              variant={episode.status === "published" ? "default" : "secondary"}
            >
              {episode.status}
            </Badge>
          </div>
          <SheetTitle>
            #{episode.episodeNumber}: {episode.title}
          </SheetTitle>
          <SheetDescription>
            {formatDate(episode.publishedAt)} · {formatDuration(episode.duration)}
            {episode.guestName && ` · Guest: ${episode.guestName}`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Episode Metadata Section */}
          <section>
            <h3 className="font-semibold mb-2">Episode Details</h3>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">Audio URL</dt>
              <dd className="truncate">
                <a
                  href={episode.audioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:underline text-primary"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open
                </a>
              </dd>
              {episode.description && (
                <>
                  <dt className="text-muted-foreground col-span-2">
                    Description
                  </dt>
                  <dd className="col-span-2 text-sm">{episode.description}</dd>
                </>
              )}
            </dl>
          </section>

          {/* Chapters Section */}
          <section>
            <h3 className="font-semibold mb-2">
              Chapters {chapters && `(${chapters.length})`}
            </h3>
            {chapters === undefined ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : chapters.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No chapters imported
              </p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {chapters.map((ch, i) => (
                  <li key={ch._id} className="border rounded p-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {i + 1}. {ch.title}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatDuration(ch.startTime)} -{" "}
                        {formatDuration(ch.endTime)}
                      </span>
                    </div>
                    {ch.summary && (
                      <p className="text-muted-foreground text-xs mt-1">
                        {ch.summary}
                      </p>
                    )}
                    {ch.semanticTags && ch.semanticTags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {ch.semanticTags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Clips Section */}
          <section>
            <h3 className="font-semibold mb-2">
              Clips {clips && `(${clips.length})`}
            </h3>
            {clips === undefined ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : clips.length === 0 ? (
              <p className="text-sm text-muted-foreground">No clips generated</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {clips.map((clip) => (
                  <li key={clip._id} className="border rounded p-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{clip.title}</span>
                      <span className="text-muted-foreground text-xs">
                        {formatDuration(clip.startTime)} -{" "}
                        {formatDuration(clip.endTime)}
                      </span>
                    </div>
                    {clip.summary && (
                      <p className="text-muted-foreground text-xs mt-1">
                        {clip.summary}
                      </p>
                    )}
                    {clip.topics && clip.topics.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {clip.topics.slice(0, 5).map((topic) => (
                          <Badge
                            key={topic}
                            variant="outline"
                            className="text-xs"
                          >
                            {topic}
                          </Badge>
                        ))}
                        {clip.topics.length > 5 && (
                          <span className="text-xs text-muted-foreground">
                            +{clip.topics.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Transcript Summary Section */}
          <section>
            <h3 className="font-semibold mb-2">
              Transcript Segments {segments && `(${segments.length})`}
            </h3>
            {segments === undefined ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : segments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No transcript imported
              </p>
            ) : (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Speakers: {getUniqueSpeakers(segments).join(", ")}
                </div>
                {/* Show first 10 segments as preview */}
                <div className="max-h-64 overflow-y-auto border rounded p-2 space-y-1">
                  {segments.slice(0, 10).map((seg) => (
                    <div key={seg._id} className="text-xs">
                      <span className="font-medium text-primary">
                        {seg.speaker}:
                      </span>{" "}
                      <span className="text-muted-foreground">{seg.text}</span>
                    </div>
                  ))}
                  {segments.length > 10 && (
                    <p className="text-xs text-muted-foreground italic">
                      ...and {segments.length - 10} more segments
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
