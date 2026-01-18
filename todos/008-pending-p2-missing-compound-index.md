---
status: pending
priority: p2
issue_id: "008"
tags: [code-review, performance, pr-8]
dependencies: []
---

# Missing Compound Index for Processing Job Queries

## Problem Statement

Queries filter jobs by both `episodeId` AND `type`, but the index only covers `episodeId`. Code loads all jobs then filters in JavaScript.

## Findings

### Architecture Strategist Agent

**File:** `convex/chapters.ts:248-254`
```typescript
const jobs = await ctx.db
  .query("processingJobs")
  .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
  .order("desc")
  .collect();

const latestJob = jobs.find((j) => j.type === "chapter_import");  // JS filtering
```

### Impact
- Loads all jobs for an episode when only one type is needed
- Worsens as more job types are added (summarization, embeddings, etc.)
- Every status check is inefficient

## Proposed Solutions

### Option A: Add Compound Index
**Pros:** Database-level filtering
**Cons:** Schema change
**Effort:** Small
**Risk:** Low

```typescript
// schema.ts
processingJobs: defineTable({...})
  .index("by_episode_type", ["episodeId", "type"])
```

### Option B: Use Existing getLatestForEpisode Query
**Pros:** Already exists in codebase
**Cons:** Query still has same issue internally
**Effort:** Small
**Risk:** Low

## Recommended Action
[To be filled during triage]

## Technical Details

**Affected Files:**
- `convex/schema.ts` - Add compound index
- `convex/chapters.ts` - Use new index
- `convex/transcriptImport.ts` - Use new index

## Acceptance Criteria
- [ ] Compound index `by_episode_type` exists
- [ ] Job queries use the new index
- [ ] No JavaScript filtering for job type

## Work Log
| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-18 | Identified during code review | Compound indexes help common query patterns |

## Resources
- PR #8: https://github.com/nabeelhyatt/hallwaychat/pull/8
