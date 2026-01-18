import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all published episodes, sorted by publish date (newest first)
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const episodes = await ctx.db
      .query("episodes")
      .withIndex("by_published")
      .order("desc")
      .filter((q) => q.eq(q.field("status"), "published"))
      .take(limit);

    return episodes;
  },
});

// Get a single episode by ID with its clips
export const getById = query({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, args) => {
    const episode = await ctx.db.get(args.episodeId);
    if (!episode) return null;

    const clips = await ctx.db
      .query("clips")
      .withIndex("by_episode", (q) => q.eq("episodeId", args.episodeId))
      .collect();

    // Sort clips by start time
    clips.sort((a, b) => a.startTime - b.startTime);

    return { ...episode, clips };
  },
});

// Get episode by episode number
export const getByNumber = query({
  args: { episodeNumber: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("episodes")
      .withIndex("by_episode_number", (q) =>
        q.eq("episodeNumber", args.episodeNumber)
      )
      .first();
  },
});

// Create a new episode (admin use)
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    episodeNumber: v.number(),
    publishedAt: v.number(),
    duration: v.number(),
    audioUrl: v.string(),
    thumbnailUrl: v.optional(v.string()),
    guestName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("episodes", {
      ...args,
      status: "draft",
    });
  },
});

// Update episode status
export const updateStatus = mutation({
  args: {
    episodeId: v.id("episodes"),
    status: v.union(
      v.literal("draft"),
      v.literal("processing"),
      v.literal("published")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.episodeId, { status: args.status });
  },
});

// Get recent episodes for homepage
export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;

    return await ctx.db
      .query("episodes")
      .withIndex("by_published")
      .order("desc")
      .filter((q) => q.eq(q.field("status"), "published"))
      .take(limit);
  },
});

// Get all episodes (including drafts) for admin
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("episodes")
      .withIndex("by_episode_number")
      .order("desc")
      .collect();
  },
});
