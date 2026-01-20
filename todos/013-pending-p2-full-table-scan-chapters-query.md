---
status: pending
priority: p2
issue_id: "013"
tags: [code-review, performance, convex]
dependencies: []
pr: "#10"
---

# Full Table Scan in listRecentWithEpisodes Query

## Problem Statement

The new `listRecentWithEpisodes` query fetches ALL chapters from the database into memory, then filters client-side. This is O(n) where n = total chapters and will degrade as the dataset grows.

**Why it matters:** With 39+ episodes and ~10-15 chapters each, the current dataset has ~500 chapters. At 2,000-3,000 chapters (~200-300 episodes), query time will exceed 500ms.

## Findings

**From performance-oracle:**
- Line `convex/chapters.ts:336`: `await ctx.db.query("chapters").collect()` performs full table scan
- No index filtering is used
- Memory usage scales linearly with chapter count
- JavaScript `Array.sort()` adds O(n log n) overhead

**From architecture-strategist:**
- Existing patterns in `convex/episodes.ts` and `convex/clips.ts` use indexed queries
- The `by_episode` index exists but is unused

## Proposed Solutions

### Option A: Add hasSummary Boolean Field + Index
**Pros:** Enables index-based filtering, follows Convex patterns
**Cons:** Requires schema migration, needs backfill
**Effort:** Medium
**Risk:** Low

Add `hasSummary: v.boolean()` field set during summary generation, then query with `.withIndex("by_summary_status", q => q.eq("hasSummary", true))`.

### Option B: Denormalize publishedAt onto Chapters
**Pros:** Enables server-side sorting without episode join
**Cons:** Data duplication, needs sync logic
**Effort:** Medium
**Risk:** Medium

### Option C: Accept Technical Debt with Scaling Ticket
**Pros:** Ship fast, address when needed
**Cons:** Performance degrades at scale
**Effort:** Low
**Risk:** Medium (monitoring required)

## Recommended Action

<!-- Filled during triage -->

## Technical Details

**Affected files:**
- `convex/chapters.ts:332-364`
- `convex/schema.ts` (if adding index)

**Breaking point estimate:** ~2,000-3,000 chapters

## Acceptance Criteria

- [ ] Query uses index-based filtering OR scaling ticket created
- [ ] Query time <100ms at current scale
- [ ] Monitoring added if accepting tech debt

## Work Log

| Date | Action | Learning |
|------|--------|----------|
| 2026-01-19 | Created from PR #10 review | Multiple reviewers flagged performance concern |

## Resources

- PR #10: https://github.com/nabeelhyatt/hallwaychat/pull/10
- Convex indexing docs
