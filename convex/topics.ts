import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all topics, sorted by clip count
export const list = query({
  handler: async (ctx) => {
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_clip_count")
      .order("desc")
      .collect();

    return topics;
  },
});

// Get a topic by slug
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("topics")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

// Get clips for a topic
export const getClips = query({
  args: {
    slug: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const topic = await ctx.db
      .query("topics")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!topic) return { topic: null, clips: [] };

    // Get all clips and filter by topic
    // Note: In a larger app, we'd want a join table for this
    const allClips = await ctx.db.query("clips").collect();

    const topicClips = allClips
      .filter((c) => c.topics.includes(topic.name))
      .sort((a, b) => b.createdAt - a.createdAt) // Newest first
      .slice(0, limit);

    // Fetch episode info
    const clipsWithEpisodes = await Promise.all(
      topicClips.map(async (clip) => {
        const episode = await ctx.db.get(clip.episodeId);
        return {
          ...clip,
          episode: episode
            ? {
                _id: episode._id,
                title: episode.title,
                episodeNumber: episode.episodeNumber,
              }
            : null,
        };
      })
    );

    return { topic, clips: clipsWithEpisodes };
  },
});

// Update topic counts (run after clip changes)
export const updateCounts = mutation({
  handler: async (ctx) => {
    // Get all clips
    const clips = await ctx.db.query("clips").collect();

    // Count topics
    const topicCounts = new Map<string, number>();
    for (const clip of clips) {
      for (const topic of clip.topics) {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      }
    }

    // Update or create topics
    for (const [name, count] of topicCounts) {
      const slug = name.toLowerCase().replace(/\s+/g, "-");

      const existing = await ctx.db
        .query("topics")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, { clipCount: count });
      } else {
        await ctx.db.insert("topics", {
          name,
          slug,
          clipCount: count,
        });
      }
    }

    // Remove topics that no longer have clips
    const allTopics = await ctx.db.query("topics").collect();
    for (const topic of allTopics) {
      if (!topicCounts.has(topic.name)) {
        await ctx.db.delete(topic._id);
      }
    }
  },
});

// Get top N topics for the topic cloud
export const getTopTopics = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    return await ctx.db
      .query("topics")
      .withIndex("by_clip_count")
      .order("desc")
      .take(limit);
  },
});
