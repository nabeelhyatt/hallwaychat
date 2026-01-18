---
status: pending
priority: p3
issue_id: "011"
tags: [code-review, simplicity, pr-8]
dependencies: []
---

# YAGNI: Unused Code Should Be Removed

## Problem Statement

Several functions, job types, and UI elements are defined for future phases but not currently used. This adds maintenance burden and complexity.

## Findings

### Code Simplicity Reviewer Agent

**Unused Code:**

1. **Job Types (schema.ts, processingJobs.ts)**
   - `chapter_summarization` - Phase 2.75
   - `clip_segmentation` - Phase 3
   - `embedding_generation` - Phase 4
   - `visual_generation` - Phase 4

2. **Unused Queries/Mutations (chapters.ts)**
   - `updateSummary` (line 328-335) - Not called
   - `getSegmentsByChapter` (line 338-347) - No consumer
   - `get` (line 239-245) - Simple db.get wrapper, likely unused

3. **Unused Query (processingJobs.ts)**
   - `getLatestForEpisode` (line 89-103) - Duplicates logic in getImportStatus

4. **Disabled UI Elements (admin/page.tsx)**
   - "Generate Summaries" button - Feature doesn't exist
   - "View Segments" button - Disabled
   - "Start Clip Segmentation" button - Phase 3

### Estimated LOC to Remove: ~100 lines

## Proposed Solutions

### Option A: Remove All Unused Code
**Pros:** Cleaner codebase, follows YAGNI
**Cons:** Need to re-add when implementing features
**Effort:** Small
**Risk:** Low

### Option B: Keep but Document
**Pros:** Ready for future phases
**Cons:** Unused code confusion
**Effort:** None
**Risk:** Low

## Recommended Action
[To be filled during triage]

## Technical Details

**Files to Clean:**
- `convex/schema.ts` - Remove unused job types
- `convex/processingJobs.ts` - Remove unused job types
- `convex/chapters.ts` - Remove unused queries/mutations
- `src/app/admin/page.tsx` - Remove disabled buttons

## Acceptance Criteria
- [ ] Unused code removed or documented as placeholder
- [ ] No dead code paths

## Work Log
| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-18 | Identified during code review | YAGNI principle applies |

## Resources
- PR #8: https://github.com/nabeelhyatt/hallwaychat/pull/8
