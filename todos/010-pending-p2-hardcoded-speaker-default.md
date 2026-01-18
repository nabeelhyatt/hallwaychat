---
status: pending
priority: p2
issue_id: "010"
tags: [code-review, data-integrity, pr-8]
dependencies: []
---

# Hardcoded Default Speaker Creates Data Integrity Risk

## Problem Statement

The transcript parser defaults to "Fraser" as the speaker when no speaker is detected. This assumption may not hold for guest episodes or different transcript formats.

## Findings

### Architecture Strategist Agent

**File:** `convex/lib/transcriptParser.ts:100`
```typescript
let lastSpeaker = "Fraser"; // Default to Fraser as primary host
```

### Impact
- Segments without explicit speaker labels are attributed to Fraser
- Guest-heavy episodes may have incorrect speaker attribution
- Different transcript formats may not have speakers at all

## Proposed Solutions

### Option A: Use "Unknown" as Default
**Pros:** Honest about uncertainty
**Cons:** Less useful for search/display
**Effort:** Small
**Risk:** Low

### Option B: Make Default Configurable
**Pros:** Flexible per-episode
**Cons:** More complex API
**Effort:** Small
**Risk:** Low

Pass `defaultSpeaker` as parameter to parser.

### Option C: Flag Unattributed Segments
**Pros:** Allows manual review
**Cons:** Adds complexity
**Effort:** Medium
**Risk:** Low

## Recommended Action
[To be filled during triage]

## Technical Details

**Affected Files:**
- `convex/lib/transcriptParser.ts`

## Acceptance Criteria
- [ ] Default speaker is configurable or clearly documented
- [ ] Unknown speakers are flagged or use "Unknown" label

## Work Log
| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-18 | Identified during code review | Assumptions about data should be configurable |

## Resources
- PR #8: https://github.com/nabeelhyatt/hallwaychat/pull/8
