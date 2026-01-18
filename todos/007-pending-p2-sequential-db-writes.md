---
status: pending
priority: p2
issue_id: "007"
tags: [code-review, performance, pr-8]
dependencies: []
---

# Sequential Database Writes in Loops

## Problem Statement

Segment insertion and chapter linking perform sequential `await` calls in loops, creating N database round-trips. For long podcasts (100+ segments), this causes unnecessary latency.

## Findings

### Performance Oracle Agent

**File:** `convex/transcriptImport.ts:117-128`
```typescript
for (const segment of segments) {
  await ctx.db.insert("transcriptSegments", {...});  // N sequential inserts
}
```

**File:** `convex/chapters.ts:161-170`
```typescript
for (const segment of segments) {
  await ctx.db.patch(segment._id, { chapterId: chapter._id });  // N sequential patches
}
```

### Impact
- A 1-hour podcast with ~120 segments = 120 sequential database calls
- Chapter linking adds another 120 sequential calls
- Potential timeout on large episodes

## Proposed Solutions

### Option A: Accept Current Pattern (Document)
**Pros:** Convex handles batching within mutations
**Cons:** Still sequential awaits
**Effort:** None
**Risk:** Low

Convex mutations are atomic; the sequential pattern is acceptable for data integrity. Add comment explaining this.

### Option B: Chunk Large Imports
**Pros:** Prevents timeouts
**Cons:** More complex
**Effort:** Medium
**Risk:** Low

Process in batches of 50 segments per mutation call.

## Recommended Action
[To be filled during triage]

## Technical Details

**Affected Files:**
- `convex/transcriptImport.ts`
- `convex/chapters.ts`

## Acceptance Criteria
- [ ] Large imports (500+ segments) complete without timeout
- [ ] Pattern is documented if kept as-is

## Work Log
| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-18 | Identified during code review | Convex mutations handle this reasonably |

## Resources
- PR #8: https://github.com/nabeelhyatt/hallwaychat/pull/8
