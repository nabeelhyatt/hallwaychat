---
status: pending
priority: p3
issue_id: "025"
tags: [code-review, dry, maintainability]
dependencies: []
---

# Duplicate formatDuration Function

## Problem Statement

The `formatDuration` function is identically defined in both `EpisodeDetailSheet.tsx` and `admin/page.tsx`. This violates DRY and creates maintenance burden.

**Why it matters:** Bug fixes or format changes need to be made in multiple places.

## Findings

**File 1:** `src/components/admin/EpisodeDetailSheet.tsx:48-56`
**File 2:** `src/app/admin/page.tsx:82-91`

```typescript
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
```

**Agent source:** code-simplicity-reviewer

## Proposed Solutions

### Option A: Extract to shared utility (Recommended)
**Effort:** Small (5 min)
**Risk:** None
**Pros:** DRY, single source of truth
**Cons:** None

Create `src/lib/format.ts`:
```typescript
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
```

## Recommended Action

Option A - extract to shared utility file.

## Technical Details

**Affected files:**
- Create: `src/lib/format.ts`
- Modify: `src/components/admin/EpisodeDetailSheet.tsx`
- Modify: `src/app/admin/page.tsx`

**Acceptance Criteria:**
- [ ] Single formatDuration implementation in src/lib/format.ts
- [ ] Both files import from shared location
- [ ] No duplicate implementations

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-01-19 | Created | Found during PR review |

## Resources

- PR: uncommitted changes on nabeelhyatt/cairo-v1
