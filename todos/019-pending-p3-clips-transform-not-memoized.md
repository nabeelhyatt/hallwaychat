---
status: pending
priority: p3
issue_id: "019"
tags: [code-review, performance, react]
dependencies: []
pr: "#10"
---

# Clips Transformation Not Memoized

## Problem Statement

The `clips` variable is created by mapping over `chapters` on every render, creating new object references. While the data content is the same, React may re-render child components unnecessarily due to referential inequality.

**Why it matters:** Minor performance optimization opportunity. Currently negligible but becomes relevant with more chapters.

## Findings

**From performance-oracle:**
- Location: `src/app/page.tsx:33-46`
- The `topics` aggregation uses `useMemo` but `clips` transformation doesn't
- Creates new objects on every render

**Code:**
```typescript
const clips = chapters?.map((ch) => ({
  _id: ch._id,
  title: ch.title,
  // ... creates new objects each render
}));
```

## Proposed Solutions

### Option A: Wrap in useMemo
**Pros:** Prevents unnecessary object creation
**Cons:** Minor additional code
**Effort:** Small
**Risk:** None

```typescript
const clips = useMemo(() =>
  chapters?.map((ch) => ({ ... })),
  [chapters]
);
```

### Option B: Accept Current Behavior
**Pros:** Simpler code
**Cons:** Minor perf overhead
**Effort:** None
**Risk:** None (negligible impact)

## Recommended Action

<!-- Filled during triage -->

## Technical Details

**Affected files:**
- `src/app/page.tsx:33-46`

## Acceptance Criteria

- [ ] Transform memoized OR explicitly accepted as negligible

## Work Log

| Date | Action | Learning |
|------|--------|----------|
| 2026-01-19 | Created from PR #10 review | Performance reviewer flagged optimization |

## Resources

- PR #10: https://github.com/nabeelhyatt/hallwaychat/pull/10
