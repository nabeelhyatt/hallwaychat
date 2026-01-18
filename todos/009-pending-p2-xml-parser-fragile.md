---
status: pending
priority: p2
issue_id: "009"
tags: [code-review, architecture, pr-8]
dependencies: []
---

# Regex-Based XML Parsing is Fragile

## Problem Statement

The custom regex-based XML parsing is fragile and does not handle edge cases like CDATA sections, nested tags, entities, or malformed XML.

## Findings

### Architecture Strategist Agent

**File:** `convex/rss.ts:21-38`
```typescript
function getTagContent(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${escapedTag}[^>]*>([^<]*)</${escapedTag}>`, "i");
  // ...
}
```

### Limitations
- Does not handle CDATA sections
- Fails on nested tags with same name
- Doesn't decode HTML entities
- Could produce incorrect data from valid RSS feeds

## Proposed Solutions

### Option A: Use XML Parser Library
**Pros:** Handles all edge cases, battle-tested
**Cons:** Adds dependency
**Effort:** Small
**Risk:** Low

Use `fast-xml-parser` or `xml2js` (can run in Node.js actions).

### Option B: Document Limitations and Add Tests
**Pros:** No new dependency
**Cons:** Edge cases not handled
**Effort:** Small
**Risk:** Medium

Add comment documenting what's supported and unit tests for current behavior.

## Recommended Action
[To be filled during triage]

## Technical Details

**Affected Files:**
- `convex/rss.ts` - Replace regex with XML parser

## Acceptance Criteria
- [ ] RSS parsing handles CDATA sections
- [ ] HTML entities are decoded
- [ ] Edge cases documented or handled

## Work Log
| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-18 | Identified during code review | Regex XML parsing has known limitations |

## Resources
- PR #8: https://github.com/nabeelhyatt/hallwaychat/pull/8
