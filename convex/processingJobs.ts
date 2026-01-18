import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Get a single processing job by ID
export const get = query({
  args: { jobId: v.id("processingJobs") },
  handler: async (ctx, { jobId }) => {
    return await ctx.db.get(jobId);
  },
});

// List processing jobs for an episode
export const listByEpisode = query({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, { episodeId }) => {
    return await ctx.db
      .query("processingJobs")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .order("desc")
      .collect();
  },
});

// List all processing jobs by status
export const listByStatus = query({
  args: {
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, { status }) => {
    return await ctx.db
      .query("processingJobs")
      .withIndex("by_status", (q) => q.eq("status", status))
      .collect();
  },
});

// Create a new processing job (internal - called from actions)
export const create = internalMutation({
  args: {
    type: v.union(
      v.literal("transcript_import"),
      v.literal("chapter_import"),
      v.literal("chapter_summarization"),
      v.literal("clip_segmentation"),
      v.literal("embedding_generation"),
      v.literal("visual_generation")
    ),
    episodeId: v.optional(v.id("episodes")),
    clipId: v.optional(v.id("clips")),
    chapterId: v.optional(v.id("chapters")),
  },
  handler: async (ctx, { type, episodeId, clipId, chapterId }) => {
    return await ctx.db.insert("processingJobs", {
      type,
      episodeId,
      clipId,
      chapterId,
      status: "pending",
      progress: 0,
      startedAt: Date.now(),
    });
  },
});

// Update processing job status (internal - called from actions)
export const updateStatus = internalMutation({
  args: {
    jobId: v.id("processingJobs"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    progress: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { jobId, status, progress, error }) => {
    const updates: Record<string, unknown> = { status };

    if (progress !== undefined) {
      updates.progress = progress;
    }

    if (error !== undefined) {
      updates.error = error;
    }

    if (status === "completed" || status === "failed") {
      updates.completedAt = Date.now();
    }

    if (status === "processing") {
      updates.startedAt = Date.now();
    }

    await ctx.db.patch(jobId, updates);
  },
});

// Update progress only
export const updateProgress = internalMutation({
  args: {
    jobId: v.id("processingJobs"),
    progress: v.number(),
  },
  handler: async (ctx, { jobId, progress }) => {
    await ctx.db.patch(jobId, { progress });
  },
});

// Get the latest processing job for an episode and type
export const getLatestForEpisode = query({
  args: {
    episodeId: v.id("episodes"),
    type: v.union(
      v.literal("transcript_import"),
      v.literal("chapter_import"),
      v.literal("chapter_summarization"),
      v.literal("clip_segmentation"),
      v.literal("embedding_generation"),
      v.literal("visual_generation")
    ),
  },
  handler: async (ctx, { episodeId, type }) => {
    const jobs = await ctx.db
      .query("processingJobs")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .order("desc")
      .collect();

    return jobs.find((job) => job.type === type) || null;
  },
});
