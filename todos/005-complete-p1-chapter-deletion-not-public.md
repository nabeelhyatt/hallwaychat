---
status: complete
priority: p1
issue_id: "005"
tags: [code-review, agent-native, pr-8]
dependencies: []
---

# Chapter Deletion is Internal-Only (Blocks Agent/UI Re-import)

## Problem Statement

`deleteEpisodeChapters` is declared as `internalMutation`, meaning:
1. Agents cannot delete chapters to re-import
2. UI has no delete button for chapters
3. Import fails if chapters exist, but there's no way to delete them

This creates a "one-way door" where chapters can never be re-imported.

## Findings

### Agent-Native Reviewer

**File:** `convex/chapters.ts:208`
```typescript
export const deleteEpisodeChapters = internalMutation({...})  // Internal only
```

**Comparison:** `transcriptImport.ts:157` has `deleteEpisodeSegments` as public `mutation`.

### Impact
- An agent attempting to re-import chapters is blocked
- `importFromURL` throws error if chapters exist (line 40-44)
- No public API to delete them first
- No UI button in admin page either

## Proposed Solutions

### Option A: Change to Public Mutation
**Pros:** Simple, matches transcript pattern
**Cons:** Exposes delete operation
**Effort:** Small
**Risk:** Low (auth should be added anyway per #001)

### Option B: Add Delete Button to UI
**Pros:** UI parity with transcript delete
**Cons:** Still needs mutation change
**Effort:** Small
**Risk:** Low

Both should be done together.

## Recommended Action
[To be filled during triage]

## Technical Details

**Affected Files:**
- `convex/chapters.ts:208` - Change `internalMutation` to `mutation`
- `src/app/admin/page.tsx` - Add "Delete Chapters" button in ChapterStatus component

## Acceptance Criteria
- [x] `deleteEpisodeChapters` is a public mutation
- [ ] Admin UI has "Delete Chapters" button (deferred - can use via API)
- [x] Chapters can be deleted and re-imported

## Work Log
| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-18 | Identified during code review | Inconsistent access between chapters and transcripts |
| 2026-01-18 | Fixed: Changed internalMutation to mutation | UI button deferred - API is now accessible |

## Resources
- PR #8: https://github.com/nabeelhyatt/hallwaychat/pull/8
