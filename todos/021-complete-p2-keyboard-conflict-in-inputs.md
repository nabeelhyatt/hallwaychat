---
status: complete
priority: p2
issue_id: "021"
tags: [code-review, accessibility, keyboard, ux]
dependencies: []
---

# Keyboard Navigation Conflicts with Input Fields

## Problem Statement

The arrow key navigation for the episode detail sheet triggers when the user is focused on input fields, textareas, or contenteditable elements. This causes unexpected episode switching while typing.

**Why it matters:** Poor UX when using text inputs in the admin page while sheet is open.

## Findings

**File:** `src/app/admin/page.tsx`
**Lines:** 459-468

```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  if (!isSheetOpen) return;
  if (e.key === "ArrowLeft") handlePrevious();
  if (e.key === "ArrowRight") handleNext();
};
```

The handler does not check if the event target is an interactive element before handling arrow keys.

**Agent source:** kieran-typescript-reviewer

## Proposed Solutions

### Option A: Check target element type (Recommended)
**Effort:** Small (5 min)
**Risk:** Low
**Pros:** Standard pattern, comprehensive
**Cons:** None

```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  if (!isSheetOpen) return;

  const target = e.target as HTMLElement;
  if (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  ) {
    return;
  }

  if (e.key === "ArrowLeft") handlePrevious();
  if (e.key === "ArrowRight") handleNext();
};
```

### Option B: Move keyboard handling into sheet component
**Effort:** Medium (15 min)
**Risk:** Low
**Pros:** Better encapsulation, sheet owns its behavior
**Cons:** Requires refactoring

## Recommended Action

Option A for immediate fix. Consider Option B as a future refactor.

## Technical Details

**Affected files:**
- `src/app/admin/page.tsx`

**Acceptance Criteria:**
- [ ] Arrow keys in input fields move cursor, not switch episodes
- [ ] Arrow keys on page body still navigate episodes when sheet is open
- [ ] Textareas behave normally

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-01-19 | Created | Found during PR review |

## Resources

- PR: uncommitted changes on nabeelhyatt/cairo-v1
