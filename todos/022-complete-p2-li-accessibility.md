---
status: complete
priority: p2
issue_id: "022"
tags: [code-review, accessibility, a11y]
dependencies: []
---

# Clickable List Items Lack Keyboard Accessibility

## Problem Statement

The episode list items in the admin page are clickable but not keyboard accessible. Users relying on keyboard navigation cannot activate episodes using Enter or Space keys.

**Why it matters:** WCAG accessibility compliance, screen reader users cannot use the feature.

## Findings

**File:** `src/app/admin/page.tsx`
**Lines:** 674-689

```typescript
<li
  key={ep._id}
  className="... cursor-pointer ..."
  onClick={() => handleEpisodeClick(index)}
>
```

Missing:
- `role="button"` to indicate interactive element
- `tabIndex={0}` to make focusable
- `onKeyDown` handler for Enter/Space keys

**Agent source:** kieran-typescript-reviewer

## Proposed Solutions

### Option A: Add accessibility attributes to li (Recommended)
**Effort:** Small (5 min)
**Risk:** Low
**Pros:** Minimal change, preserves existing DOM structure
**Cons:** li with role="button" is semantically awkward

```typescript
<li
  key={ep._id}
  role="button"
  tabIndex={0}
  className="... cursor-pointer ..."
  onClick={() => handleEpisodeClick(index)}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleEpisodeClick(index);
    }
  }}
>
```

### Option B: Use button element styled as list item
**Effort:** Medium (10 min)
**Risk:** Low
**Pros:** Semantic correctness, native keyboard support
**Cons:** Requires CSS adjustments

## Recommended Action

Option A for quick fix. Option B is more semantically correct if time permits.

## Technical Details

**Affected files:**
- `src/app/admin/page.tsx`

**Acceptance Criteria:**
- [ ] Can Tab to episode list items
- [ ] Enter key opens episode detail sheet
- [ ] Space key opens episode detail sheet
- [ ] Focus indicator visible on focused items

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-01-19 | Created | Found during PR review |

## Resources

- PR: uncommitted changes on nabeelhyatt/cairo-v1
- WCAG 2.1 Guideline 2.1: Keyboard Accessible
