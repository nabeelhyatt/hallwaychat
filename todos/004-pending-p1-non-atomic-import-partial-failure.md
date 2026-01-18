---
status: pending
priority: p1
issue_id: "004"
tags: [code-review, data-integrity, pr-8]
dependencies: []
---

# Non-Atomic Multi-Step Import Can Leave Partial Data

## Problem Statement

The chapter import action performs 4 separate mutations without transaction guarantees. If the action fails after inserting chapters but before linking segments, the database is left in an inconsistent state with no way to recover without manual intervention.

## Findings

### Architecture Strategist Agent

**File:** `convex/chapters.ts:47-110`
The import performs sequential mutations:
1. Create job (line 47)
2. Update job status (line 53)
3. Insert chapters (line 71)
4. Link segments to chapters (line 82) - **If this fails, chapters exist but are not linked**

### Corruption Scenario
1. Import starts, chapters inserted successfully
2. `linkSegmentsToChapters` fails (e.g., timeout on large dataset)
3. Job marked as "failed"
4. User retries import
5. Import fails with "Episode already has chapters" error
6. Orphaned chapters with no linked segments remain

## Proposed Solutions

### Option A: Combine Operations in Single Mutation
**Pros:** Atomic - all or nothing
**Cons:** Larger mutation, may hit limits
**Effort:** Medium
**Risk:** Low

Merge `insertChapters` and `linkSegmentsToChapters` into one mutation.

### Option B: Add Rollback on Failure
**Pros:** Maintains current structure
**Cons:** More complex error handling
**Effort:** Medium
**Risk:** Low

```typescript
try {
  await ctx.runMutation(internal.chapters.insertChapters, {...});
  await ctx.runMutation(internal.chapters.linkSegmentsToChapters, {...});
} catch (error) {
  await ctx.runMutation(internal.chapters.deleteEpisodeChapters, { episodeId });
  throw error;
}
```

### Option C: Idempotent Re-import
**Pros:** User can retry without manual cleanup
**Cons:** More complex logic
**Effort:** Medium
**Risk:** Medium

Allow re-import to update existing chapters instead of failing.

## Recommended Action
[To be filled during triage]

## Technical Details

**Affected Files:**
- `convex/chapters.ts` - Add rollback or combine mutations

## Acceptance Criteria
- [ ] Failed import does not leave orphaned chapters
- [ ] User can retry import after failure
- [ ] Either rollback cleans up or re-import updates existing

## Work Log
| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-18 | Identified during code review | Multi-step actions need atomicity plan |

## Resources
- PR #8: https://github.com/nabeelhyatt/hallwaychat/pull/8
