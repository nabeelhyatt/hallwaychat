---
status: pending
priority: p3
issue_id: "018"
tags: [code-review, typescript, quality]
dependencies: []
pr: "#10"
---

# Context Default Value Masks Missing Provider Errors

## Problem Statement

The `ConvexAvailableContext` has a default value of `false`, meaning if `useConvexAvailable()` is called outside a provider, it silently returns `false` instead of throwing an error.

**Why it matters:** In development, this could mask configuration errors. A component using the hook outside the provider would silently behave as if Convex is unavailable.

## Findings

**From kieran-typescript-reviewer:**
- Location: `src/components/providers/ConvexClientProvider.tsx:7`
- Code: `createContext<boolean>(false)`
- Default `false` is used when no provider wraps the component

## Proposed Solutions

### Option A: Use Null Default with Throw
**Pros:** Errors surface immediately in dev
**Cons:** Slightly more code
**Effort:** Small
**Risk:** None

```typescript
const ConvexAvailableContext = createContext<boolean | null>(null);

export function useConvexAvailable(): boolean {
  const value = useContext(ConvexAvailableContext);
  if (value === null) {
    throw new Error("useConvexAvailable must be within ConvexClientProvider");
  }
  return value;
}
```

### Option B: Accept Current Behavior
**Pros:** Simpler code
**Cons:** Silent failures possible
**Effort:** None
**Risk:** Low (provider is in root layout)

## Recommended Action

<!-- Filled during triage -->

## Technical Details

**Affected files:**
- `src/components/providers/ConvexClientProvider.tsx:7-11`

## Acceptance Criteria

- [ ] Missing provider throws OR explicitly documented as acceptable

## Work Log

| Date | Action | Learning |
|------|--------|----------|
| 2026-01-19 | Created from PR #10 review | TypeScript reviewer flagged silent failure |

## Resources

- PR #10: https://github.com/nabeelhyatt/hallwaychat/pull/10
