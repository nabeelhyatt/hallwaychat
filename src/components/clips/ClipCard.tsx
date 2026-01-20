"use client";

import { useCallback } from "react";
import { Play, Clock, Pause, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAudioPlayerOptional } from "@/components/providers/AudioPlayerProvider";
import { formatDuration } from "@/lib/format";

export type ContentType = "chapter" | "clip" | "episode";

interface ClipCardProps {
  clip: {
    _id: string;
    title: string;
    summary: string;
    keyQuote?: string;
    duration: number;
    topics: string[];
    aiEra?: string;
    guestName?: string;
    episode?: {
      title: string;
      episodeNumber: number;
      audioUrl?: string;
    } | null;
    // Audio playback props
    audioUrl?: string;
    startTime?: number;
    endTime?: number;
    type?: ContentType;
  };
  showEpisode?: boolean;
}

const TYPE_LABELS: Record<ContentType, string> = {
  chapter: "Chapter",
  clip: "Clip",
  episode: "Episode",
};

export function ClipCard({ clip, showEpisode = true }: ClipCardProps) {
  const player = useAudioPlayerOptional();

  // Determine if this clip is currently playing or loading
  const isThisItem = player?.currentItem?.id === clip._id;
  const isCurrentlyPlaying = isThisItem && player?.isPlaying;
  const isCurrentlyLoading = isThisItem && player?.isLoading;

  // Check if we have audio data for playback
  const audioUrl = clip.audioUrl || clip.episode?.audioUrl;
  const canPlay = !!(audioUrl && clip.startTime !== undefined && clip.endTime !== undefined);

  // P2 fix: Memoize handler
  const handlePlay = useCallback(() => {
    if (!player || !canPlay) return;

    if (isCurrentlyPlaying) {
      player.pause();
    } else {
      player.play({
        id: clip._id,
        audioUrl: audioUrl!,
        startTime: clip.startTime!,
        endTime: clip.endTime!,
        title: clip.title,
        episodeTitle: clip.episode?.title,
        type: clip.type || "chapter",
      });
    }
  }, [player, canPlay, isCurrentlyPlaying, clip, audioUrl]);

  // P2 fix: Memoize keyboard handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handlePlay();
    }
  }, [handlePlay]);

  const contentType = clip.type || "chapter";

  return (
    <Card
      className={`group h-full overflow-hidden transition-shadow duration-200 ${
        canPlay ? "cursor-pointer hover:shadow-lg" : ""
      } ${isCurrentlyPlaying ? "ring-2 ring-primary" : ""}`}
      onClick={canPlay ? handlePlay : undefined}
      role={canPlay ? "button" : undefined}
      tabIndex={canPlay ? 0 : undefined}
      onKeyDown={canPlay ? handleKeyDown : undefined}
    >
      {/* Visual header */}
      <div className="relative aspect-video bg-primary">
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <h3 className="text-white text-lg font-bold text-center line-clamp-3">
            {clip.title}
          </h3>
        </div>

        {/* Play overlay */}
        {canPlay && (
          <div
            className={`absolute inset-0 bg-black/20 transition-opacity flex items-center justify-center ${
              isCurrentlyPlaying || isCurrentlyLoading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <div className="bg-white rounded-full p-3 shadow-lg">
              {isCurrentlyLoading ? (
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              ) : isCurrentlyPlaying ? (
                <Pause className="w-6 h-6 text-primary" />
              ) : (
                <Play className="w-6 h-6 text-primary" />
              )}
            </div>
          </div>
        )}

        {/* Type badge */}
        <div
          className="absolute top-2 left-2 bg-black/50 text-white/80
                        text-xs px-2 py-1 rounded"
        >
          {TYPE_LABELS[contentType]}
        </div>

        {/* Duration badge */}
        <div
          className="absolute bottom-2 right-2 bg-black/70 text-white
                        text-xs px-2 py-1 rounded flex items-center gap-1"
        >
          <Clock className="w-3 h-3" />
          {formatDuration(clip.duration)}
        </div>

        {/* Guest badge */}
        {clip.guestName && (
          <div
            className="absolute top-2 right-2 bg-white/90 text-foreground
                          text-xs px-2 py-1 rounded font-medium"
          >
            ft. {clip.guestName}
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Summary */}
        {clip.summary && (
          <p className="text-sm text-muted-foreground line-clamp-4 mb-3">
            {clip.summary}
          </p>
        )}

        {/* Key quote */}
        {clip.keyQuote && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 italic">
            &quot;{clip.keyQuote}&quot;
          </p>
        )}

        {/* Topics */}
        <div className="flex flex-wrap gap-1 mb-3">
          {clip.topics.slice(0, 3).map((topic) => (
            <Badge key={topic} variant="secondary" className="text-xs">
              {topic}
            </Badge>
          ))}
        </div>

        {/* Episode info */}
        {showEpisode && clip.episode && (
          <p className="text-xs text-muted-foreground">
            Ep {clip.episode.episodeNumber}: {clip.episode.title}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
