import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Episodes table - stores full episode metadata
  episodes: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    episodeNumber: v.number(),
    publishedAt: v.number(), // Unix timestamp in ms
    duration: v.number(), // Total duration in seconds
    audioUrl: v.string(), // External URL to audio (e.g., Transistor)
    thumbnailUrl: v.optional(v.string()),
    guestName: v.optional(v.string()), // If it's a guest episode
    status: v.union(
      v.literal("draft"),
      v.literal("processing"),
      v.literal("published")
    ),
  })
    .index("by_published", ["publishedAt"])
    .index("by_status", ["status"])
    .index("by_episode_number", ["episodeNumber"]),

  // Chapters table - human-curated topical divisions from Transistor
  chapters: defineTable({
    episodeId: v.id("episodes"),
    title: v.string(), // From Transistor: "Cold Open" (marker)
    summary: v.optional(v.string()), // AI-generated: 2-sentence insight
    semanticTags: v.optional(v.array(v.string())), // AI-generated: keywords for search
    startTime: v.number(), // seconds
    endTime: v.number(), // seconds
    description: v.optional(v.string()), // Optional manual description
    orderIndex: v.number(), // chapter order in episode
  })
    .index("by_episode", ["episodeId"])
    .index("by_time", ["episodeId", "startTime"]),

  // Clips table - 2-5 minute topical segments (AI-generated within chapters)
  clips: defineTable({
    episodeId: v.id("episodes"),
    chapterId: v.optional(v.id("chapters")), // Link to parent chapter
    title: v.string(), // AI-generated
    summary: v.string(), // 1-2 sentence summary
    keyQuote: v.optional(v.string()), // Highlighted quote for preview
    startTime: v.number(), // Start timestamp in seconds
    endTime: v.number(), // End timestamp in seconds
    duration: v.number(), // Clip duration in seconds
    transcript: v.string(), // Full transcript text for this clip
    topics: v.array(v.string()), // Topic tags like ["ai-strategy", "fundraising"]
    importance: v.number(), // 0-1 score for weighting in search
    guestName: v.optional(v.string()), // From episode, for filtering
    aiEra: v.optional(v.string()), // "gpt-4-era", "claude-3-era", etc.
    aiMentions: v.optional(v.array(v.string())), // ["GPT-4", "Claude 3"]
    isFeatured: v.boolean(), // Manually curated for homepage
    playCount: v.number(), // Analytics: total plays
    createdAt: v.number(),
    embedding: v.optional(v.array(v.float64())), // Vector embedding for search
  })
    .index("by_episode", ["episodeId"])
    .index("by_chapter", ["chapterId"])
    .index("by_created", ["createdAt"])
    .index("by_featured", ["isFeatured"])
    .index("by_play_count", ["playCount"]),

  // Transcript segments - speaker-turn data for precise playback
  transcriptSegments: defineTable({
    episodeId: v.id("episodes"),
    chapterId: v.optional(v.id("chapters")), // Link to parent chapter
    clipId: v.optional(v.id("clips")),
    speaker: v.string(), // "Fraser" or "Nabeel" or guest name
    text: v.string(),
    startTime: v.number(),
    endTime: v.number(),
  })
    .index("by_episode", ["episodeId"])
    .index("by_chapter", ["chapterId"])
    .index("by_clip", ["clipId"])
    .index("by_time", ["episodeId", "startTime"]),

  // Topics table - for browse/filter functionality
  topics: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    clipCount: v.number(),
    color: v.optional(v.string()), // For UI badge coloring
  })
    .index("by_slug", ["slug"])
    .index("by_clip_count", ["clipCount"]),

  // Processing jobs - track import/processing status
  processingJobs: defineTable({
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
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    progress: v.optional(v.number()), // 0-100
    error: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_episode", ["episodeId"]),
});
