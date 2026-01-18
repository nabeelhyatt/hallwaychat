import Link from "next/link";
import { Play, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
    } | null;
  };
  showEpisode?: boolean;
}

export function ClipCard({ clip, showEpisode = true }: ClipCardProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Link href={`/clip/${clip._id}`}>
      <Card className="group h-full overflow-hidden hover:shadow-lg transition-shadow duration-200">
        {/* Visual header */}
        <div className="relative aspect-video bg-primary">
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <h3 className="text-white text-lg font-bold text-center line-clamp-3">
              {clip.title}
            </h3>
          </div>

          {/* Play overlay */}
          <div
            className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100
                          transition-opacity flex items-center justify-center"
          >
            <div className="bg-white rounded-full p-3 shadow-lg">
              <Play className="w-6 h-6 text-primary" />
            </div>
          </div>

          {/* Duration badge */}
          <div
            className="absolute bottom-2 right-2 bg-black/70 text-white
                          text-xs px-2 py-1 rounded flex items-center gap-1"
          >
            <Clock className="w-3 h-3" />
            {formatDuration(clip.duration)}
          </div>

          {/* AI Era badge */}
          {clip.aiEra && (
            <div
              className="absolute top-2 left-2 bg-black/50 text-white/80
                            text-xs px-2 py-1 rounded"
            >
              {clip.aiEra.replace(/-/g, " ").replace("era", "Era")}
            </div>
          )}

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
    </Link>
  );
}
