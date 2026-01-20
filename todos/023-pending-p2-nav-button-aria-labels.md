---
status: pending
priority: p2
issue_id: "023"
tags: [code-review, accessibility, a11y]
dependencies: []
---

# Navigation Buttons Missing Accessible Labels

## Problem Statement

The Previous/Next navigation buttons in EpisodeDetailSheet use only icon content without accessible labels, making them unusable for screen reader users.

**Why it matters:** Screen readers announce these as generic "button" with no purpose indication.

## Findings

**File:** `src/components/admin/EpisodeDetailSheet.tsx`
**Lines:** 96-111

```typescript
<Button
  variant="ghost"
  size="icon"
  onClick={onPrevious}
  disabled={!hasPrevious}
>
  <ChevronLeft className="h-4 w-4" />
</Button>
```

No `aria-label` or screen-reader text provided.

**Agent source:** pattern-recognition-specialist

## Proposed Solutions

### Option A: Add aria-label (Recommended)
**Effort:** Minimal (2 min)
**Risk:** None
**Pros:** Simple, effective
**Cons:** None

```typescript
<Button
  variant="ghost"
  size="icon"
  onClick={onPrevious}
  disabled={!hasPrevious}
  aria-label="Previous episode"
>
  <ChevronLeft className="h-4 w-4" />
</Button>
```

### Option B: Add sr-only span
**Effort:** Minimal (2 min)
**Risk:** None
**Pros:** Visual text for additional clarity if needed
**Cons:** Slightly more verbose

## Recommended Action

Option A - add aria-label to both navigation buttons.

## Technical Details

**Affected files:**
- `src/components/admin/EpisodeDetailSheet.tsx`

**Changes:**
- Line 96-102: Add `aria-label="Previous episode"`
- Line 104-110: Add `aria-label="Next episode"`

**Acceptance Criteria:**
- [ ] Screen reader announces "Previous episode" button
- [ ] Screen reader announces "Next episode" button

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-01-19 | Created | Found during PR review |

## Resources

- PR: uncommitted changes on nabeelhyatt/cairo-v1
