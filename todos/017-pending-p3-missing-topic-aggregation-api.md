---
status: pending
priority: p3
issue_id: "017"
tags: [code-review, agent-native, api]
dependencies: []
pr: "#10"
---

# Missing Server-Side Topic Aggregation API

## Problem Statement

The topic cloud computes tag counts client-side using `useMemo`. An agent querying `listRecentWithEpisodes` would receive raw tag arrays but need to implement its own aggregation logic to understand prevalent topics.

**Why it matters:** Violates agent-native principle - an agent should be able to access the same derived data users see without replicating business logic.

## Findings

**From agent-native-reviewer:**
- Location: `src/app/page.tsx:18-30`
- Client-side computation aggregates `semanticTags` into counts
- No equivalent Convex query for agents

**Code:**
```typescript
const topics = useMemo(() => {
  const counts: Record<string, number> = {};
  chapters.forEach((ch) =>
    (ch.semanticTags ?? []).forEach((tag) => {
      counts[tag] = (counts[tag] ?? 0) + 1;
    })
  );
  return Object.entries(counts).sort(([,a],[,b]) => b-a).slice(0,10);
}, [chapters]);
```

## Proposed Solutions

### Option A: Add getTopSemanticTags Query
**Pros:** Full agent parity, reusable
**Cons:** Adds code
**Effort:** Small
**Risk:** None

```typescript
export const getTopSemanticTags = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    // Same aggregation logic, server-side
  },
});
```

### Option B: Include Aggregated Tags in listRecentWithEpisodes
**Pros:** Single query, no additional call
**Cons:** Mixed concerns
**Effort:** Small
**Risk:** Low

### Option C: Accept Gap, Document for Future
**Pros:** Ship fast
**Cons:** Agent parity incomplete
**Effort:** None
**Risk:** Low

## Recommended Action

<!-- Filled during triage -->

## Technical Details

**Affected files:**
- `convex/chapters.ts` (add query)
- `src/app/page.tsx` (optionally use server-side)

## Acceptance Criteria

- [ ] Agents can query top semantic tags OR gap explicitly documented

## Work Log

| Date | Action | Learning |
|------|--------|----------|
| 2026-01-19 | Created from PR #10 review | Agent-native reviewer flagged parity gap |

## Resources

- PR #10: https://github.com/nabeelhyatt/hallwaychat/pull/10
