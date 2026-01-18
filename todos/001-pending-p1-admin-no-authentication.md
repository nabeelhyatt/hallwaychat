---
status: pending
priority: p1
issue_id: "001"
tags: [code-review, security, pr-8]
dependencies: []
---

# No Authentication on Admin Page and Mutations

## Problem Statement

The admin page at `/admin` and several Convex mutations are publicly accessible without any authentication. Any visitor can:
- Access the admin page and trigger data imports
- Delete transcript segments via public mutation
- Create episodes and flood the database with processing jobs

This is a critical security vulnerability for production deployment.

## Findings

### Security Sentinel Agent

**File:** `src/app/admin/page.tsx`
- The entire admin page has no auth checks
- Any visitor can access this page at `/admin`

**File:** `convex/transcriptImport.ts:157`
- `deleteEpisodeSegments` is a public mutation with no authorization

**File:** `convex/episodes.ts:56,76`
- `episodes.create` and `episodes.updateStatus` are public mutations

### Impact
- Attackers can trigger unlimited imports, causing resource exhaustion
- Attackers can delete all transcript segments for any episode
- Attackers can flood the database with processing jobs
- Data can be deleted or manipulated by any client

## Proposed Solutions

### Option A: Add Clerk/NextAuth Authentication
**Pros:** Industry standard, full user management
**Cons:** Adds dependency, more setup
**Effort:** Medium
**Risk:** Low

### Option B: Environment-based Admin Token
**Pros:** Simple, no external dependency
**Cons:** Single shared secret, no user tracking
**Effort:** Small
**Risk:** Low

### Option C: Convert Mutations to Internal
**Pros:** Prevents direct client access
**Cons:** Requires actions to wrap mutations
**Effort:** Small
**Risk:** Low

## Recommended Action
[To be filled during triage]

## Technical Details

**Affected Files:**
- `src/app/admin/page.tsx` - Add auth wrapper
- `convex/transcriptImport.ts` - Change `mutation` to `internalMutation`
- `convex/episodes.ts` - Add auth checks or convert to internal

## Acceptance Criteria
- [ ] Admin page requires authentication to access
- [ ] Public mutations either require auth or are converted to internal
- [ ] Unauthorized users receive appropriate error messages

## Work Log
| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-18 | Identified during code review | No auth implemented for MVP |

## Resources
- PR #8: https://github.com/nabeelhyatt/hallwaychat/pull/8
- OWASP Broken Access Control: https://owasp.org/Top10/A01_2021-Broken_Access_Control/
