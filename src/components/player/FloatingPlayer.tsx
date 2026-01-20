"use client";

import { Play, Pause, X, Loader2 } from "lucide-react";
import * as Slider from "@radix-ui/react-slider";
import { useAudioPlayerOptional } from "@/components/providers/AudioPlayerProvider";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/format";

const TYPE_LABELS = {
  chapter: "Chapter",
  clip: "Clip",
  episode: "Episode",
} as const;

export function FloatingPlayer() {
  const player = useAudioPlayerOptional();

  // Don't render if no player context or no current item
  if (!player || !player.currentItem) {
    return null;
  }

  const { currentItem, isPlaying, isLoading, clipProgress, clipDuration, toggle, seek, clear } = player;

  // Calculate time display
  const currentClipTime = clipProgress * clipDuration;

  const handleSliderChange = (value: number[]) => {
    seek(value[0] / 100);
  };

  // P3 fix: Use clear() to fully dismiss player
  const handleClose = () => {
    clear();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      {/* Progress bar - full width at top of player */}
      <div className="w-full h-1 bg-muted">
        <Slider.Root
          className="relative flex items-center w-full h-full cursor-pointer touch-none select-none"
          value={[clipProgress * 100]}
          onValueChange={handleSliderChange}
          max={100}
          step={0.1}
          disabled={isLoading} // P1 fix: disable during load
        >
          <Slider.Track className="relative h-full w-full bg-muted overflow-hidden">
            <Slider.Range className="absolute h-full bg-primary" />
          </Slider.Track>
          <Slider.Thumb
            className="block w-3 h-3 bg-primary rounded-full shadow-md
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                       hover:scale-110 transition-transform disabled:opacity-50"
            aria-label="Playback position"
          />
        </Slider.Root>
      </div>

      {/* Main player content */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Play/Pause/Loading button */}
          <button
            onClick={toggle}
            disabled={isLoading}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground
                       flex items-center justify-center hover:bg-primary/90 transition-colors
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                       disabled:opacity-70"
            aria-label={isLoading ? "Loading" : isPlaying ? "Pause" : "Play"}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>

          {/* Track info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {TYPE_LABELS[currentItem.type]}
              </Badge>
              <h3 className="text-sm font-medium truncate">
                {currentItem.title}
              </h3>
            </div>
            {currentItem.episodeTitle && (
              <p className="text-xs text-muted-foreground truncate">
                {currentItem.episodeTitle}
              </p>
            )}
          </div>

          {/* Time display */}
          <div className="flex-shrink-0 text-xs text-muted-foreground font-mono">
            <span>{formatDuration(currentClipTime)}</span>
            <span className="mx-1">/</span>
            <span>{formatDuration(clipDuration)}</span>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 w-8 h-8 rounded-full text-muted-foreground
                       flex items-center justify-center hover:bg-muted transition-colors
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
