---
status: pending
priority: p3
issue_id: "016"
tags: [code-review, quality, yagni]
dependencies: []
pr: "#10"
---

# YAGNI: ClipCard href Prop Added But Unused

## Problem Statement

The PR adds an optional `href` prop to `ClipCard` "for future linking" but never uses it. The homepage renders ClipCards without passing `href`, making chapters non-clickable.

**Why it matters:** This is a YAGNI violation - adding code for hypothetical future needs. It also changes existing behavior (cards were previously always linked to `/clip/${id}`).

## Findings

**From code-simplicity-reviewer:**
- Location: `src/components/clips/ClipCard.tsx:21`
- The `href` prop is defined but never passed in `page.tsx:91`
- Previous behavior: Always linked to `/clip/${id}`
- Current behavior: No link (cards are not clickable)

**From architecture-strategist:**
- This is a breaking change from original behavior
- Should verify intent: are chapters meant to be non-clickable?

## Proposed Solutions

### Option A: Remove href Prop, Keep Original Behavior
**Pros:** YAGNI compliant, cards remain clickable
**Cons:** May need to re-add later
**Effort:** Small
**Risk:** None

### Option B: Pass href on Homepage
**Pros:** Cards are clickable as before
**Cons:** Links to non-existent `/chapter/[id]` page
**Effort:** Small
**Risk:** Low (404 is acceptable during dev)

### Option C: Accept YAGNI Violation, Document Intent
**Pros:** Ship fast
**Cons:** Technical debt
**Effort:** None
**Risk:** Low

## Recommended Action

<!-- Filled during triage -->

## Technical Details

**Affected files:**
- `src/components/clips/ClipCard.tsx:21, 109-113`
- `src/app/page.tsx:91`

## Acceptance Criteria

- [ ] Decision made on card linking behavior
- [ ] Either remove unused prop OR use it

## Work Log

| Date | Action | Learning |
|------|--------|----------|
| 2026-01-19 | Created from PR #10 review | Simplicity reviewer flagged YAGNI |

## Resources

- PR #10: https://github.com/nabeelhyatt/hallwaychat/pull/10
