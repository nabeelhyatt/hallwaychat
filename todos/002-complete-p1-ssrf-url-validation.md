---
status: complete
priority: p1
issue_id: "002"
tags: [code-review, security, pr-8]
dependencies: []
---

# Server-Side Request Forgery (SSRF) via User-Controlled URLs

## Problem Statement

The `transcriptUrl` and `chaptersUrl` parameters are passed directly to `fetch()` without URL validation. An attacker could provide URLs to:
- Internal services (localhost, 169.254.x.x for cloud metadata)
- Exfiltrate data to attacker-controlled servers

## Findings

### Security Sentinel Agent

**File:** `convex/rss.ts:140`
```typescript
const response = await fetch(transcriptUrl);  // User-controlled URL
```

**File:** `convex/chapters.ts:60`
```typescript
const response = await fetch(chaptersUrl);  // User-controlled URL
```

**File:** `convex/transcriptImport.ts:51`
```typescript
const response = await fetch(transcriptUrl);  // User-controlled URL
```

### Impact
- Could allow probing internal infrastructure
- Potential data exfiltration
- Access to cloud metadata endpoints

## Proposed Solutions

### Option A: URL Allowlist Validation
**Pros:** Simple, effective
**Cons:** Limits flexibility
**Effort:** Small
**Risk:** Low

```typescript
const ALLOWED_HOSTS = ['transistor.fm', 'share.transistor.fm', 'feeds.transistor.fm'];
const url = new URL(transcriptUrl);
if (!ALLOWED_HOSTS.some(host => url.hostname.endsWith(host))) {
  throw new Error('URL must be from transistor.fm');
}
```

### Option B: Network-Level Restrictions
**Pros:** Defense in depth
**Cons:** Requires infrastructure changes
**Effort:** Large
**Risk:** Medium

## Recommended Action
[To be filled during triage]

## Technical Details

**Affected Files:**
- `convex/rss.ts` - Add URL validation before fetch
- `convex/chapters.ts` - Add URL validation before fetch
- `convex/transcriptImport.ts` - Add URL validation before fetch

## Acceptance Criteria
- [x] All fetch operations validate URL against allowlist
- [x] Attempting to fetch non-allowed URLs throws descriptive error
- [x] Internal IPs and localhost are blocked

## Work Log
| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-18 | Identified during code review | External URLs need validation |
| 2026-01-18 | Fixed: Created convex/lib/urlValidator.ts with allowlist validation | |

## Resources
- PR #8: https://github.com/nabeelhyatt/hallwaychat/pull/8
- OWASP SSRF: https://owasp.org/www-community/attacks/Server_Side_Request_Forgery
