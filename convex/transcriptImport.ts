import { action, internalQuery, query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { parseTransistorTranscript } from "./lib/transcriptParser";
import { validateTransistorUrl } from "./lib/urlValidator";

// Return type for import action
interface ImportResult {
  success: boolean;
  jobId: Id<"processingJobs">;
  segmentCount: number;
  speakerCounts: Record<string, number>;
  totalDuration: number;
  errors?: string[];
}

// Import transcript from a Transistor URL
export const importFromURL = action({
  args: {
    episodeId: v.id("episodes"),
    transcriptUrl: v.string(),
    episodeDuration: v.optional(v.number()),
  },
  handler: async (ctx, { episodeId, transcriptUrl, episodeDuration }): Promise<ImportResult> => {
    // 1. Check if segments already exist
    const existingCount = await ctx.runQuery(
      internal.transcriptImport.getSegmentCountInternal,
      { episodeId }
    );

    if (existingCount > 0) {
      throw new Error(
        `Episode already has ${existingCount} segments. Delete them first to re-import.`
      );
    }

    // 2. Create processing job
    const jobId = await ctx.runMutation(internal.processingJobs.create, {
      type: "transcript_import",
      episodeId,
    });

    // Update status to processing
    await ctx.runMutation(internal.processingJobs.updateStatus, {
      jobId,
      status: "processing",
    });

    try {
      // 3. Validate URL and fetch transcript from Transistor
      validateTransistorUrl(transcriptUrl);
      const response = await fetch(transcriptUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch transcript: ${response.status}`);
      }
      const content = await response.text();

      if (!content || content.trim().length === 0) {
        throw new Error("Transcript is empty");
      }

      // 4. Parse Transistor format
      const { segments, speakerCounts, errors, totalDuration } =
        parseTransistorTranscript(content, episodeDuration);

      if (segments.length === 0) {
        throw new Error(
          `No segments parsed. Errors: ${errors.join(", ") || "Unknown"}`
        );
      }

      // 5. Insert segments via mutation (batch for performance)
      await ctx.runMutation(internal.transcriptImport.insertSegments, {
        episodeId,
        segments,
      });

      // 6. Mark job complete
      await ctx.runMutation(internal.processingJobs.updateStatus, {
        jobId,
        status: "completed",
        progress: 100,
      });

      return {
        success: true,
        jobId,
        segmentCount: segments.length,
        speakerCounts,
        totalDuration,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      // Mark job as failed
      await ctx.runMutation(internal.processingJobs.updateStatus, {
        jobId,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
});

// Internal mutation - batch insert segments
export const insertSegments = internalMutation({
  args: {
    episodeId: v.id("episodes"),
    segments: v.array(
      v.object({
        speaker: v.string(),
        text: v.string(),
        startTime: v.number(),
        endTime: v.number(),
      })
    ),
  },
  handler: async (ctx, { episodeId, segments }) => {
    for (const segment of segments) {
      await ctx.db.insert("transcriptSegments", {
        episodeId,
        clipId: undefined,
        speaker: segment.speaker,
        text: segment.text,
        startTime: segment.startTime,
        endTime: segment.endTime,
      });
    }
    return segments.length;
  },
});

// Get segment count for an episode (internal query for action)
export const getSegmentCountInternal = internalQuery({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, { episodeId }): Promise<number> => {
    const segments = await ctx.db
      .query("transcriptSegments")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .collect();
    return segments.length;
  },
});

// Get all segments for an episode
export const getEpisodeSegments = query({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, { episodeId }) => {
    return ctx.db
      .query("transcriptSegments")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .order("asc")
      .collect();
  },
});

// Delete all segments for an episode (for re-import)
export const deleteEpisodeSegments = mutation({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, { episodeId }) => {
    const segments = await ctx.db
      .query("transcriptSegments")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .collect();

    for (const segment of segments) {
      await ctx.db.delete(segment._id);
    }

    return { deleted: segments.length };
  },
});

// Check import status for an episode
export const getImportStatus = query({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, { episodeId }) => {
    // Get segment count
    const segments = await ctx.db
      .query("transcriptSegments")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .collect();

    // Get latest processing job
    const jobs = await ctx.db
      .query("processingJobs")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .order("desc")
      .collect();

    const latestJob = jobs.find((j) => j.type === "transcript_import");

    // Calculate speaker counts from existing segments
    const speakerCounts: Record<string, number> = {};
    for (const seg of segments) {
      speakerCounts[seg.speaker] = (speakerCounts[seg.speaker] || 0) + 1;
    }

    // Calculate total duration from segments
    const totalDuration =
      segments.length > 0
        ? Math.max(...segments.map((s) => s.endTime))
        : 0;

    return {
      hasSegments: segments.length > 0,
      segmentCount: segments.length,
      speakerCounts,
      totalDuration,
      latestJob: latestJob
        ? {
            status: latestJob.status,
            progress: latestJob.progress,
            error: latestJob.error,
            startedAt: latestJob.startedAt,
            completedAt: latestJob.completedAt,
          }
        : null,
    };
  },
});
