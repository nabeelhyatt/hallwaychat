import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get a single clip by ID with episode info
export const getById = query({
  args: { clipId: v.id("clips") },
  handler: async (ctx, args) => {
    const clip = await ctx.db.get(args.clipId);
    if (!clip) return null;

    const episode = await ctx.db.get(clip.episodeId);
    if (!episode) return null;

    // Get transcript segments for this clip
    const segments = await ctx.db
      .query("transcriptSegments")
      .withIndex("by_clip", (q) => q.eq("clipId", args.clipId))
      .collect();

    // Sort segments by start time
    segments.sort((a, b) => a.startTime - b.startTime);

    return {
      ...clip,
      episode: {
        _id: episode._id,
        title: episode.title,
        episodeNumber: episode.episodeNumber,
        audioUrl: episode.audioUrl,
        publishedAt: episode.publishedAt,
      },
      segments,
    };
  },
});

// Get all clips for an episode
export const getByEpisode = query({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, args) => {
    const clips = await ctx.db
      .query("clips")
      .withIndex("by_episode", (q) => q.eq("episodeId", args.episodeId))
      .collect();

    // Sort by start time
    clips.sort((a, b) => a.startTime - b.startTime);

    return clips;
  },
});

// Get featured clips for homepage
export const getFeatured = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 12;

    const clips = await ctx.db
      .query("clips")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .take(limit);

    // Fetch episode info for each clip
    const clipsWithEpisodes = await Promise.all(
      clips.map(async (clip) => {
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

    return clipsWithEpisodes;
  },
});

// Get recent clips
export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 12;

    const clips = await ctx.db
      .query("clips")
      .withIndex("by_created")
      .order("desc")
      .take(limit);

    // Fetch episode info for each clip
    const clipsWithEpisodes = await Promise.all(
      clips.map(async (clip) => {
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

    return clipsWithEpisodes;
  },
});

// Get popular clips by play count
export const getPopular = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 12;

    const clips = await ctx.db
      .query("clips")
      .withIndex("by_play_count")
      .order("desc")
      .take(limit);

    // Fetch episode info for each clip
    const clipsWithEpisodes = await Promise.all(
      clips.map(async (clip) => {
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

    return clipsWithEpisodes;
  },
});

// Increment play count for a clip
export const incrementPlayCount = mutation({
  args: { clipId: v.id("clips") },
  handler: async (ctx, args) => {
    const clip = await ctx.db.get(args.clipId);
    if (!clip) return;

    await ctx.db.patch(args.clipId, {
      playCount: clip.playCount + 1,
    });
  },
});

// Toggle featured status (admin use)
export const toggleFeatured = mutation({
  args: { clipId: v.id("clips") },
  handler: async (ctx, args) => {
    const clip = await ctx.db.get(args.clipId);
    if (!clip) return;

    await ctx.db.patch(args.clipId, {
      isFeatured: !clip.isFeatured,
    });
  },
});

// Get related clips (same topic or episode)
export const getRelated = query({
  args: {
    clipId: v.id("clips"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 4;
    const clip = await ctx.db.get(args.clipId);
    if (!clip) return [];

    // Get clips from same episode (excluding current)
    const sameEpisodeClips = await ctx.db
      .query("clips")
      .withIndex("by_episode", (q) => q.eq("episodeId", clip.episodeId))
      .collect();

    // Filter out current clip and limit
    const relatedFromEpisode = sameEpisodeClips
      .filter((c) => c._id !== args.clipId)
      .slice(0, Math.ceil(limit / 2));

    // If we need more, get clips with similar topics
    const neededMore = limit - relatedFromEpisode.length;
    let topicRelated: typeof sameEpisodeClips = [];

    if (neededMore > 0 && clip.topics.length > 0) {
      // Get all clips and filter by topic match
      // Note: This is not optimal for large datasets, but works for MVP
      const allClips = await ctx.db.query("clips").take(100);

      topicRelated = allClips
        .filter((c) => {
          if (c._id === args.clipId) return false;
          if (c.episodeId === clip.episodeId) return false;
          // Check for topic overlap
          return c.topics.some((t) => clip.topics.includes(t));
        })
        .slice(0, neededMore);
    }

    const related = [...relatedFromEpisode, ...topicRelated];

    // Fetch episode info for each
    return Promise.all(
      related.map(async (c) => {
        const episode = await ctx.db.get(c.episodeId);
        return {
          ...c,
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
  },
});
