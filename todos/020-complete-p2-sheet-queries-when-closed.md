---
status: complete
priority: p2
issue_id: "020"
tags: [code-review, performance, react, convex]
dependencies: []
---

# Sheet Queries Execute When Closed

## Problem Statement

The EpisodeDetailSheet component executes three Convex queries (chapters, clips, segments) whenever an episode is selected, even when the sheet is closed. This causes unnecessary data fetching and network requests.

**Why it matters:** Wasted API calls, increased server load, and potential billing impact from Convex reads.

## Findings

**File:** `src/components/admin/EpisodeDetailSheet.tsx`
**Lines:** 72-85

```typescript
const chapters = useQuery(
  api.chapters.getByEpisode,
  episode ? { episodeId: episode._id } : "skip"
);
```

The queries only check if `episode` is truthy, but don't check if `open` is true. When a user clicks an episode and then closes the sheet without selecting a new one, the queries continue running.

**Agent source:** pattern-recognition-specialist

## Proposed Solutions

### Option A: Include `open` in skip condition (Recommended)
**Effort:** Small (5 min)
**Risk:** Low
**Pros:** Simple one-line fix per query
**Cons:** None

```typescript
const chapters = useQuery(
  api.chapters.getByEpisode,
  episode && open ? { episodeId: episode._id } : "skip"
);
```

### Option B: Reset selectedEpisodeIndex when sheet closes
**Effort:** Small (5 min)
**Risk:** Low
**Pros:** Fixes the root cause in the parent
**Cons:** Loses the "last viewed episode" context

## Recommended Action

Option A - add `open` to the skip condition for all three queries.

## Technical Details

**Affected files:**
- `src/components/admin/EpisodeDetailSheet.tsx` (3 query calls)

**Acceptance Criteria:**
- [ ] Queries show "skip" when sheet is closed
- [ ] Queries execute when sheet is opened
- [ ] Network tab shows no queries when sheet is closed

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-01-19 | Created | Found during PR review |

## Resources

- PR: uncommitted changes on nabeelhyatt/cairo-v1
- Convex docs: https://docs.convex.dev/functions/query-functions#conditional-queries
