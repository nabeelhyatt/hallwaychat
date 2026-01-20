---
status: pending
priority: p3
issue_id: "014"
tags: [code-review, typescript, quality]
dependencies: []
pr: "#10"
---

# Non-null Assertion Bypasses Type Safety

## Problem Statement

The `listRecentWithEpisodes` query uses `e!._id` after filtering with `filter(Boolean)`. TypeScript doesn't narrow the type after `filter(Boolean)`, so the non-null assertion (`!`) tells TypeScript to trust the developer rather than proving type safety.

**Why it matters:** Non-null assertions can mask bugs when code changes and the assumption becomes invalid.

## Findings

**From kieran-typescript-reviewer:**
- Location: `convex/chapters.ts:345`
- Code: `episodes.filter(Boolean).map((e) => [e!._id, e])`
- The `filter(Boolean)` removes nulls but TypeScript doesn't narrow

## Proposed Solutions

### Option A: Use Type Guard
**Pros:** Proper TypeScript narrowing, removes assertion
**Cons:** Slightly more verbose
**Effort:** Small
**Risk:** None

```typescript
const episodeMap = new Map(
  episodes
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .map((e) => [e._id, e])
);
```

### Option B: Use Explicit Null Check
**Pros:** Clear intent
**Cons:** None
**Effort:** Small
**Risk:** None

```typescript
const episodeMap = new Map(
  episodes
    .flatMap((e) => e ? [[e._id, e] as const] : [])
);
```

## Recommended Action

<!-- Filled during triage -->

## Technical Details

**Affected files:**
- `convex/chapters.ts:345`

## Acceptance Criteria

- [ ] Non-null assertion removed
- [ ] Type narrowing is explicit

## Work Log

| Date | Action | Learning |
|------|--------|----------|
| 2026-01-19 | Created from PR #10 review | TypeScript reviewer flagged type safety issue |

## Resources

- PR #10: https://github.com/nabeelhyatt/hallwaychat/pull/10
