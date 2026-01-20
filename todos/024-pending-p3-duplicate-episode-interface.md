---
status: pending
priority: p3
issue_id: "024"
tags: [code-review, typescript, maintainability]
dependencies: []
---

# Duplicate Episode Interface Definition

## Problem Statement

The `Episode` interface in EpisodeDetailSheet.tsx duplicates the schema definition from Convex. This creates a maintenance burden and risks type drift.

**Why it matters:** Schema changes won't automatically propagate, leading to potential runtime errors.

## Findings

**File:** `src/components/admin/EpisodeDetailSheet.tsx`
**Lines:** 17-28

```typescript
interface Episode {
  _id: Id<"episodes">;
  title: string;
  description?: string;
  episodeNumber: number;
  publishedAt: number;
  duration: number;
  audioUrl: string;
  thumbnailUrl?: string;
  guestName?: string;
  status: "draft" | "processing" | "published";
}
```

This duplicates the shape from `convex/schema.ts`.

**Agent source:** pattern-recognition-specialist

## Proposed Solutions

### Option A: Use Convex generated types (Recommended)
**Effort:** Small (5 min)
**Risk:** Low
**Pros:** Single source of truth, auto-updates with schema
**Cons:** None

```typescript
import { Doc } from "../../../convex/_generated/dataModel";

type Episode = Doc<"episodes">;
```

### Option B: Pick specific fields from Doc
**Effort:** Small (5 min)
**Risk:** Low
**Pros:** Explicit about required fields
**Cons:** More verbose

```typescript
type Episode = Pick<Doc<"episodes">,
  "_id" | "title" | "description" | "episodeNumber" | "publishedAt" |
  "duration" | "audioUrl" | "thumbnailUrl" | "guestName" | "status"
>;
```

## Recommended Action

Option A - use `Doc<"episodes">` directly.

## Technical Details

**Affected files:**
- `src/components/admin/EpisodeDetailSheet.tsx`

**Acceptance Criteria:**
- [ ] Episode interface removed
- [ ] Component uses Doc<"episodes"> or derived type
- [ ] No TypeScript errors

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-01-19 | Created | Found during PR review |

## Resources

- PR: uncommitted changes on nabeelhyatt/cairo-v1
- Convex docs: https://docs.convex.dev/database/document-types
