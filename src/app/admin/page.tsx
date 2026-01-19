"use client";

import { useState } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";

// Episode selector with RSS data
function EpisodeSelector({
  selectedEpisodeId,
  onSelect,
  rssEpisodes,
}: {
  selectedEpisodeId: string | null;
  onSelect: (
    episodeId: string,
    transcriptUrl: string,
    chaptersUrl: string | null,
    duration: number
  ) => void;
  rssEpisodes: Array<{
    title: string;
    episodeNumber: number;
    transcriptUrl: string | null;
    chaptersUrl: string | null;
    duration: number;
    guid: string;
  }>;
}) {
  // Filter to only episodes with transcripts
  const episodesWithTranscripts = rssEpisodes.filter((ep) => ep.transcriptUrl);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Episode</label>
      <Select
        value={selectedEpisodeId || ""}
        onChange={(e) => {
          const guid = e.target.value;
          const episode = episodesWithTranscripts.find((ep) => ep.guid === guid);
          if (episode && episode.transcriptUrl) {
            onSelect(
              guid,
              episode.transcriptUrl,
              episode.chaptersUrl,
              episode.duration
            );
          }
        }}
      >
        <option value="">Choose an episode...</option>
        {episodesWithTranscripts.map((episode) => (
          <option key={episode.guid} value={episode.guid}>
            {episode.episodeNumber > 0 && `#${episode.episodeNumber}: `}
            {episode.title}
          </option>
        ))}
      </Select>
      {rssEpisodes.length > 0 &&
        episodesWithTranscripts.length < rssEpisodes.length && (
          <p className="text-xs text-muted-foreground">
            {rssEpisodes.length - episodesWithTranscripts.length} episodes
            without transcripts hidden
          </p>
        )}
    </div>
  );
}

// Format seconds to MM:SS or HH:MM:SS
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

// Chapter import status display
function ChapterStatus({
  episodeId,
  chaptersUrl,
}: {
  episodeId: Id<"episodes">;
  chaptersUrl: string | null;
}) {
  const status = useQuery(api.chapters.getImportStatus, { episodeId });
  const importChapters = useAction(api.chapters.importFromURL);
  const generateSummaries = useAction(api.chapterSummaries.generateSummaries);
  const [isImporting, setIsImporting] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!chaptersUrl) return;

    setIsImporting(true);
    setError(null);

    try {
      await importChapters({
        episodeId,
        chaptersUrl,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chapter import failed");
    } finally {
      setIsImporting(false);
    }
  };

  const handleGenerateSummaries = async () => {
    setIsSummarizing(true);
    setSummaryError(null);

    try {
      await generateSummaries({ episodeId });
    } catch (e) {
      setSummaryError(e instanceof Error ? e.message : "Summary generation failed");
    } finally {
      setIsSummarizing(false);
    }
  };

  if (!status) return null;

  const { hasChapters, chapterCount, chapters, linkedSegments, segmentCount, latestJob, summarizationJob } =
    status;

  // Derive computed state
  const allHaveSummaries = chapters?.every((ch) => ch.hasSummary) ?? false;
  const isJobInProgress = summarizationJob?.status === "processing";
  const hasChaptersToSummarize = chapterCount > 0;

  return (
    <div className="space-y-3 rounded-md border p-4">
      <h4 className="font-medium">Chapters</h4>

      {!chaptersUrl ? (
        <p className="text-sm text-muted-foreground">
          No chapters URL available for this episode
        </p>
      ) : !hasChapters ? (
        <div className="space-y-3">
          {latestJob && latestJob.status === "processing" && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
              Importing chapters...
            </div>
          )}

          {latestJob && latestJob.status === "failed" && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              Import failed: {latestJob.error}
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button
            onClick={handleImport}
            disabled={isImporting}
            variant="outline"
            size="sm"
          >
            {isImporting ? "Importing..." : "Import Chapters"}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            {chapterCount} chapters imported
          </div>

          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Segments linked:</span>{" "}
            {linkedSegments} / {segmentCount}
          </div>

          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {chapters.map((ch, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="font-mono text-muted-foreground/70">
                  {(i + 1).toString().padStart(2, "0")}
                </span>
                <span className="flex-1 truncate">{ch.title}</span>
                <span className="text-muted-foreground/70">
                  {formatDuration(ch.duration)}
                </span>
                {ch.hasSummary && (
                  <span className="text-green-600" title="Has AI summary">
                    AI
                  </span>
                )}
              </li>
            ))}
          </ul>

          {/* Summarization progress indicator */}
          {summarizationJob?.status === "processing" && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
              Generating summaries... {summarizationJob.progress}%
            </div>
          )}

          {/* Summary error display */}
          {summaryError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {summaryError}
            </div>
          )}

          {summarizationJob?.status === "failed" && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              Summary generation failed: {summarizationJob.error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={
                isSummarizing ||
                allHaveSummaries ||
                isJobInProgress ||
                !hasChaptersToSummarize
              }
              onClick={handleGenerateSummaries}
            >
              {isSummarizing || isJobInProgress
                ? "Generating..."
                : allHaveSummaries
                  ? "All Summarized"
                  : "Generate Summaries"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Transcript import status display
function ImportStatus({
  episodeId,
  chaptersUrl,
  onDelete,
}: {
  episodeId: Id<"episodes">;
  chaptersUrl: string | null;
  onDelete: () => void;
}) {
  const status = useQuery(api.transcriptImport.getImportStatus, { episodeId });

  if (!status) return null;

  const { hasSegments, segmentCount, speakerCounts, totalDuration, latestJob } =
    status;

  if (!hasSegments && !latestJob) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-muted/50 p-4 text-center text-sm text-muted-foreground">
          No transcript imported yet
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {latestJob && latestJob.status === "processing" && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
            Importing... {latestJob.progress}%
          </div>
        )}

        {latestJob && latestJob.status === "failed" && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            Import failed: {latestJob.error}
          </div>
        )}

        {hasSegments && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {segmentCount} segments imported
            </div>

            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Speakers:</span>{" "}
              {Object.entries(speakerCounts)
                .map(([name, count]) => `${name} (${count})`)
                .join(", ")}
            </div>

            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Duration:</span>{" "}
              {formatDuration(totalDuration)}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" disabled>
                View Segments
              </Button>
              <Button variant="outline" size="sm" disabled>
                Start Clip Segmentation
              </Button>
              <Button variant="destructive" size="sm" onClick={onDelete}>
                Delete Segments
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Chapter import - only show after segments are imported */}
      {hasSegments && (
        <ChapterStatus episodeId={episodeId} chaptersUrl={chaptersUrl} />
      )}
    </div>
  );
}

export default function AdminPage() {
  const [selectedGuid, setSelectedGuid] = useState<string | null>(null);
  const [selectedTranscriptUrl, setSelectedTranscriptUrl] = useState<
    string | null
  >(null);
  const [selectedChaptersUrl, setSelectedChaptersUrl] = useState<string | null>(
    null
  );
  const [selectedDuration, setSelectedDuration] = useState<number>(0);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch RSS feed
  const fetchRSS = useAction(api.rss.fetchRSSFeed);
  const [rssEpisodes, setRssEpisodes] = useState<
    Array<{
      title: string;
      episodeNumber: number;
      transcriptUrl: string | null;
      chaptersUrl: string | null;
      duration: number;
      guid: string;
      audioUrl: string;
      publishedAt: number;
      description: string;
    }>
  >([]);
  const [rssLoading, setRssLoading] = useState(false);
  const [isCreatingEpisode, setIsCreatingEpisode] = useState(false);

  // Get episodes from Convex (need to match with RSS)
  const episodes = useQuery(api.episodes.listAll);

  // Import action
  const importFromURL = useAction(api.transcriptImport.importFromURL);
  const deleteSegments = useMutation(api.transcriptImport.deleteEpisodeSegments);
  const createEpisode = useMutation(api.episodes.create);

  // Find matching Convex episode for selected RSS episode
  const selectedEpisode = episodes?.find((ep) => {
    const rssEp = rssEpisodes.find((r) => r.guid === selectedGuid);
    return rssEp && ep.episodeNumber === rssEp.episodeNumber;
  });

  const handleLoadRSS = async () => {
    setRssLoading(true);
    setError(null);
    try {
      const result = await fetchRSS();
      setRssEpisodes(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load RSS feed");
    } finally {
      setRssLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedEpisode || !selectedTranscriptUrl) {
      setError("Please select an episode with a transcript URL");
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      await importFromURL({
        episodeId: selectedEpisode._id,
        transcriptUrl: selectedTranscriptUrl,
        episodeDuration: selectedDuration || undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEpisode) return;

    if (
      !confirm(
        "Are you sure you want to delete all segments for this episode? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteSegments({ episodeId: selectedEpisode._id });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const handleCreateEpisode = async () => {
    if (!selectedRssEpisode) return;

    setIsCreatingEpisode(true);
    setError(null);

    try {
      await createEpisode({
        title: selectedRssEpisode.title,
        description: selectedRssEpisode.description || undefined,
        episodeNumber: selectedRssEpisode.episodeNumber,
        publishedAt: selectedRssEpisode.publishedAt,
        duration: selectedRssEpisode.duration,
        audioUrl: selectedRssEpisode.audioUrl,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create episode");
    } finally {
      setIsCreatingEpisode(false);
    }
  };

  const selectedRssEpisode = rssEpisodes.find((r) => r.guid === selectedGuid);

  return (
    <div className="container mx-auto max-w-3xl py-10">
      <h1 className="mb-8 text-3xl font-bold">Transcript Import</h1>

      <Card>
        <CardHeader>
          <CardTitle>Import from RSS Feed</CardTitle>
          <CardDescription>
            Fetch transcripts and chapters from the Hallway Chat Transistor RSS
            feed
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Load RSS */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Button onClick={handleLoadRSS} disabled={rssLoading}>
                {rssLoading ? "Loading..." : "Load Episodes from RSS"}
              </Button>
              {rssEpisodes.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {rssEpisodes.length} episodes loaded
                </span>
              )}
            </div>
          </div>

          {/* Step 2: Select Episode */}
          {rssEpisodes.length > 0 && (
            <EpisodeSelector
              selectedEpisodeId={selectedGuid}
              onSelect={(guid, url, chaptersUrl, duration) => {
                setSelectedGuid(guid);
                setSelectedTranscriptUrl(url);
                setSelectedChaptersUrl(chaptersUrl);
                setSelectedDuration(duration);
                setError(null);
              }}
              rssEpisodes={rssEpisodes}
            />
          )}

          {/* Selected episode info */}
          {selectedRssEpisode && (
            <div className="rounded-md border bg-muted/30 p-4">
              <p className="font-medium">{selectedRssEpisode.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Episode {selectedRssEpisode.episodeNumber} &middot;{" "}
                {formatDuration(selectedRssEpisode.duration)}
              </p>
              {selectedTranscriptUrl && (
                <p className="mt-2 truncate text-xs text-muted-foreground">
                  Transcript: {selectedTranscriptUrl}
                </p>
              )}
              {selectedChaptersUrl && (
                <p className="truncate text-xs text-muted-foreground">
                  Chapters: {selectedChaptersUrl}
                </p>
              )}
              {episodes !== undefined && !selectedEpisode && (
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-amber-600">
                    Episode not found in database. Create it first before
                    importing.
                  </p>
                  <Button
                    onClick={handleCreateEpisode}
                    disabled={isCreatingEpisode}
                    size="sm"
                    variant="outline"
                  >
                    {isCreatingEpisode ? "Creating..." : "Create Episode in Database"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Import button */}
          {selectedEpisode && selectedTranscriptUrl && (
            <div className="space-y-4">
              <Button
                onClick={handleImport}
                disabled={isImporting}
                className="w-full"
              >
                {isImporting ? "Importing..." : "Fetch & Import Transcript"}
              </Button>

              {/* Import status */}
              <ImportStatus
                episodeId={selectedEpisode._id}
                chaptersUrl={selectedChaptersUrl}
                onDelete={handleDelete}
              />
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Episodes in DB */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Episodes in Database</CardTitle>
          <CardDescription>
            Episodes must exist before importing transcripts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {episodes === undefined ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : episodes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No episodes in database. Add episodes first.
            </p>
          ) : (
            <ul className="space-y-2">
              {episodes.map((ep) => (
                <li key={ep._id} className="text-sm">
                  <span className="font-medium">#{ep.episodeNumber}:</span>{" "}
                  {ep.title}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
