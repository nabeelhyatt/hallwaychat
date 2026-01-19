---
status: pending
priority: p3
issue_id: "015"
tags: [code-review, quality, dry]
dependencies: []
pr: "#10"
---

# Duplicated Loading Skeleton Markup

## Problem Statement

The same skeleton loading pattern appears 3 times in `page.tsx` with nearly identical markup. This violates DRY and makes styling changes error-prone.

**Why it matters:** Changes to skeleton styling must be made in 3 places; easy to miss one.

## Findings

**From pattern-recognition-specialist:**
- Lines 53-58: Topic cloud skeleton in ChaptersContent
- Lines 80-85: Card skeleton in ChaptersContent
- Lines 108-113: Topic cloud skeleton in ConvexContent (identical to first)

**Code duplication:**
```typescript
{[...Array(6)].map((_, i) => (
  <div key={i} className="h-7 w-20 bg-muted animate-pulse rounded-full" />
))}
```

**Total duplicated lines:** ~28 lines (~14% of page.tsx additions)

## Proposed Solutions

### Option A: Extract Skeleton Components
**Pros:** Reusable, single source of truth
**Cons:** Adds files
**Effort:** Small
**Risk:** None

Create `TopicBadgeSkeleton` and `ClipCardSkeleton` components.

### Option B: Inline Helper Function
**Pros:** No new files, local to page
**Cons:** Less reusable
**Effort:** Small
**Risk:** None

```typescript
const renderSkeletons = (count: number, className: string) =>
  [...Array(count)].map((_, i) => (
    <div key={i} className={`bg-muted animate-pulse ${className}`} />
  ));
```

### Option C: Accept Duplication
**Pros:** Ship fast
**Cons:** Maintenance burden
**Effort:** None
**Risk:** Low

## Recommended Action

<!-- Filled during triage -->

## Technical Details

**Affected files:**
- `src/app/page.tsx:53-58, 80-85, 108-113`

## Acceptance Criteria

- [ ] Skeleton markup defined once OR explicitly accepted as tech debt

## Work Log

| Date | Action | Learning |
|------|--------|----------|
| 2026-01-19 | Created from PR #10 review | Pattern reviewer flagged duplication |

## Resources

- PR #10: https://github.com/nabeelhyatt/hallwaychat/pull/10
