---
status: pending
priority: p1
issue_id: "003"
tags: [code-review, data-integrity, pr-8]
dependencies: []
---

# Race Condition in Existence Checks Can Create Duplicate Data

## Problem Statement

The pattern of "check if exists -> then insert" is not atomic. Two concurrent imports for the same episode could pass the existence check before either completes the insert, resulting in duplicate chapters or segments.

## Findings

### Data Integrity Guardian Agent

**File:** `convex/chapters.ts:34-44`
```typescript
const existingCount = await ctx.runQuery(internal.chapters.getChapterCountInternal, { episodeId });
if (existingCount > 0) {
  throw new Error(`Episode already has ${existingCount} chapters...`);
}
// ... later ...
await ctx.runMutation(internal.chapters.insertChapters, { ... });
```

**File:** `convex/transcriptImport.ts:26-35`
Same pattern for segment imports.

### Corruption Scenario
1. User A triggers chapter import for Episode 39
2. User B triggers chapter import for Episode 39 (before A completes)
3. Both queries return `existingCount = 0`
4. Both proceed to insert chapters
5. Episode 39 now has duplicate chapters with overlapping timestamps

## Proposed Solutions

### Option A: Unique Compound Index
**Pros:** Database enforces uniqueness
**Cons:** Requires schema change
**Effort:** Small
**Risk:** Low

Add index on `(episodeId, orderIndex)` for chapters.

### Option B: Optimistic Locking with Lock Record
**Pros:** Works with current schema
**Cons:** More complex logic
**Effort:** Medium
**Risk:** Low

### Option C: Combine Check + Insert in Single Mutation
**Pros:** Atomic within Convex transaction
**Cons:** Requires restructuring action
**Effort:** Medium
**Risk:** Low

## Recommended Action
[To be filled during triage]

## Technical Details

**Affected Files:**
- `convex/schema.ts` - Add unique compound index
- `convex/chapters.ts` - Handle unique constraint violations
- `convex/transcriptImport.ts` - Same pattern fix

## Acceptance Criteria
- [ ] Concurrent imports for same episode do not create duplicates
- [ ] Second import fails gracefully with clear error message
- [ ] No partial data on concurrent import attempts

## Work Log
| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-18 | Identified during code review | Check-then-insert is not atomic in actions |

## Resources
- PR #8: https://github.com/nabeelhyatt/hallwaychat/pull/8
