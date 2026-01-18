---
status: pending
priority: p2
issue_id: "006"
tags: [code-review, type-safety, pr-8]
dependencies: []
---

# Type Assertion Without Runtime Validation on External API

## Problem Statement

External API responses (chapters.json) are type-cast without runtime validation. If Transistor changes their API format, this will fail at runtime with confusing errors.

## Findings

### Pattern Recognition Specialist Agent

**File:** `convex/chapters.ts:64`
```typescript
const data: ChaptersFile = await response.json();  // Type assertion, no validation
```

### Impact
- Runtime errors if API format changes
- Difficult debugging - error surfaces deep in code
- No clear error message about format mismatch

## Proposed Solutions

### Option A: Add Zod Runtime Validation
**Pros:** Type-safe, good error messages
**Cons:** Adds dependency (though Convex already uses Zod-like validators)
**Effort:** Small
**Risk:** Low

```typescript
const ChaptersFileSchema = z.object({
  version: z.string(),
  chapters: z.array(z.object({
    title: z.string(),
    startTime: z.number(),
    endTime: z.number(),
  })),
});
const data = ChaptersFileSchema.parse(await response.json());
```

### Option B: Manual Validation with Convex Validators
**Pros:** Uses existing Convex patterns
**Cons:** More verbose
**Effort:** Small
**Risk:** Low

## Recommended Action
[To be filled during triage]

## Technical Details

**Affected Files:**
- `convex/chapters.ts` - Add validation before using response data

## Acceptance Criteria
- [ ] External API responses are validated at runtime
- [ ] Invalid format produces clear error message
- [ ] Type safety maintained throughout

## Work Log
| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-18 | Identified during code review | External data needs runtime validation |

## Resources
- PR #8: https://github.com/nabeelhyatt/hallwaychat/pull/8
