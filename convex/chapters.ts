import { action, query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { validateTransistorUrl } from "./lib/urlValidator";

// Types for chapters.json from Transistor
interface ChapterJSON {
  title: string;
  startTime: number;
  endTime: number;
}

interface ChaptersFile {
  version: string;
  chapters: ChapterJSON[];
}

// Return type for import action
interface ChapterImportResult {
  success: boolean;
  jobId: Id<"processingJobs">;
  chapterCount: number;
  chapters: string[];
  segmentsLinked: number;
}

// Import chapters from Transistor JSON URL
export const importFromURL = action({
  args: {
    episodeId: v.id("episodes"),
    chaptersUrl: v.string(),
  },
  handler: async (ctx, { episodeId, chaptersUrl }): Promise<ChapterImportResult> => {
    // 1. Check if chapters already exist for this episode
    const existingCount = await ctx.runQuery(
      internal.chapters.getChapterCountInternal,
      { episodeId }
    );

    if (existingCount > 0) {
      throw new Error(
        `Episode already has ${existingCount} chapters. Delete them first to re-import.`
      );
    }

    // 2. Create processing job
    const jobId = await ctx.runMutation(internal.processingJobs.create, {
      type: "chapter_import",
      episodeId,
    });

    // Update status to processing
    await ctx.runMutation(internal.processingJobs.updateStatus, {
      jobId,
      status: "processing",
    });

    try {
      // 3. Validate URL and fetch chapters.json from Transistor
      validateTransistorUrl(chaptersUrl);
      const response = await fetch(chaptersUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch chapters: ${response.status}`);
      }
      const data: ChaptersFile = await response.json();

      if (!data.chapters || data.chapters.length === 0) {
        throw new Error("No chapters found in chapters.json");
      }

      // 4. Insert chapters
      await ctx.runMutation(internal.chapters.insertChapters, {
        episodeId,
        chapters: data.chapters.map((ch, i) => ({
          title: ch.title,
          startTime: ch.startTime,
          endTime: ch.endTime,
          orderIndex: i,
        })),
      });

      // 5. Link existing segments to chapters by timestamp
      const linkResult = await ctx.runMutation(
        internal.chapters.linkSegmentsToChapters,
        { episodeId }
      );

      // 6. Mark job complete
      await ctx.runMutation(internal.processingJobs.updateStatus, {
        jobId,
        status: "completed",
        progress: 100,
      });

      return {
        success: true,
        jobId,
        chapterCount: data.chapters.length,
        chapters: data.chapters.map((ch) => ch.title),
        segmentsLinked: linkResult.linked,
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

// Internal mutation - insert chapters
export const insertChapters = internalMutation({
  args: {
    episodeId: v.id("episodes"),
    chapters: v.array(
      v.object({
        title: v.string(),
        startTime: v.number(),
        endTime: v.number(),
        orderIndex: v.number(),
      })
    ),
  },
  handler: async (ctx, { episodeId, chapters }) => {
    const ids: Id<"chapters">[] = [];
    for (const chapter of chapters) {
      const id = await ctx.db.insert("chapters", {
        episodeId,
        title: chapter.title,
        startTime: chapter.startTime,
        endTime: chapter.endTime,
        orderIndex: chapter.orderIndex,
      });
      ids.push(id);
    }
    return ids;
  },
});

// Internal mutation - link segments to chapters by timestamp
export const linkSegmentsToChapters = internalMutation({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, { episodeId }) => {
    // Get all chapters for episode
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .collect();

    // Get all segments for episode
    const segments = await ctx.db
      .query("transcriptSegments")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .collect();

    let linked = 0;

    // Link each segment to its chapter based on timestamp
    for (const segment of segments) {
      const chapter = chapters.find(
        (ch) =>
          segment.startTime >= ch.startTime && segment.startTime < ch.endTime
      );
      if (chapter) {
        await ctx.db.patch(segment._id, { chapterId: chapter._id });
        linked++;
      }
    }

    return { linked };
  },
});

// Internal query - get chapter count for episode
export const getChapterCountInternal = internalQuery({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, { episodeId }): Promise<number> => {
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .collect();
    return chapters.length;
  },
});

// Get all chapters for an episode
export const getByEpisode = query({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, { episodeId }) => {
    return ctx.db
      .query("chapters")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .collect();
  },
});

// Get a single chapter by ID
export const get = query({
  args: { chapterId: v.id("chapters") },
  handler: async (ctx, { chapterId }) => {
    return ctx.db.get(chapterId);
  },
});

// Delete all chapters for an episode (for re-import)
export const deleteEpisodeChapters = mutation({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, { episodeId }) => {
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .collect();

    // Also unlink segments from chapters
    const segments = await ctx.db
      .query("transcriptSegments")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .collect();

    for (const segment of segments) {
      if (segment.chapterId) {
        await ctx.db.patch(segment._id, { chapterId: undefined });
      }
    }

    // Delete chapters
    for (const chapter of chapters) {
      await ctx.db.delete(chapter._id);
    }

    return { deleted: chapters.length };
  },
});

// Get chapter import status for an episode
export const getImportStatus = query({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, { episodeId }) => {
    // Get chapter count
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .collect();

    // Get latest processing job
    const jobs = await ctx.db
      .query("processingJobs")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .order("desc")
      .collect();

    const latestJob = jobs.find((j) => j.type === "chapter_import");
    const summarizationJob = jobs.find((j) => j.type === "chapter_summarization");

    // Count segments linked to chapters
    const segments = await ctx.db
      .query("transcriptSegments")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .collect();

    const linkedSegments = segments.filter((s) => s.chapterId).length;

    return {
      hasChapters: chapters.length > 0,
      chapterCount: chapters.length,
      chapters: chapters.map((ch) => ({
        title: ch.title,
        duration: ch.endTime - ch.startTime,
        hasSummary: !!ch.summary,
      })),
      segmentCount: segments.length,
      linkedSegments,
      latestJob: latestJob
        ? {
            status: latestJob.status,
            progress: latestJob.progress,
            error: latestJob.error,
            startedAt: latestJob.startedAt,
            completedAt: latestJob.completedAt,
          }
        : null,
      summarizationJob: summarizationJob
        ? {
            status: summarizationJob.status,
            progress: summarizationJob.progress,
            error: summarizationJob.error,
          }
        : null,
    };
  },
});

// Update chapter summary (for AI-generated summaries)
export const updateSummary = internalMutation({
  args: {
    chapterId: v.id("chapters"),
    summary: v.string(),
    semanticTags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { chapterId, summary, semanticTags }) => {
    await ctx.db.patch(chapterId, { summary, semanticTags });
  },
});

// Get segments for a specific chapter
export const getSegmentsByChapter = query({
  args: { chapterId: v.id("chapters") },
  handler: async (ctx, { chapterId }) => {
    return ctx.db
      .query("transcriptSegments")
      .withIndex("by_chapter", (q) => q.eq("chapterId", chapterId))
      .collect();
  },
});

// Internal query - get all segments for an episode (for batch fetch in summary generation)
export const getSegmentsByEpisode = internalQuery({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, { episodeId }) => {
    return ctx.db
      .query("transcriptSegments")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .collect();
  },
});
