---
title: Display Real Chapter Data with AI Summaries on Homepage
created: 2026-01-19
category: feature-implementations
tags:
  - convex-query
  - homepage-data
  - ai-summaries
  - semantic-tags
  - client-side-aggregation
  - react-hooks
  - data-integration
status: solved
complexity: medium
components:
  - convex/chapters.ts
  - src/app/page.tsx
  - src/components/clips/ClipCard.tsx
  - src/components/providers/ConvexClientProvider.tsx
related_issues:
  - PR #10
  - PR #9 (semantic tags)
  - PR #8 (transcript import)
---

# Display Real Chapter Data with AI Summaries on Homepage

## Problem Statement

The homepage was displaying hardcoded placeholder data instead of real chapters from the Convex database. Despite having a complete import pipeline (transcripts, chapters, AI summaries), the frontend showed static sample content that didn't reflect actual podcast episodes.

### Symptoms Observed

- Homepage displayed 3 fake clips with placeholder titles and summaries
- Topic cloud showed static hardcoded topics with fake counts
- Real chapters with AI-generated summaries existed in Convex but weren't visible
- No connection between the processing pipeline output and the public UI

## Root Cause Analysis

The homepage was developed with placeholder data for initial UI iteration. Once the backend pipeline was complete (PR #8-#9), no query existed to fetch the processed chapters with their episode context. The frontend had no way to:

1. Fetch chapters that have AI summaries (indicating they've been processed)
2. Join chapter data with episode metadata (title, episode number, guest)
3. Aggregate semantic tags into a topic cloud
4. Handle cases where Convex isn't configured (dev environments)

## Solution Overview

The solution involved four components working together:

```
Convex DB ──→ listRecentWithEpisodes ──→ useQuery ──→ ChaptersContent ──→ UI
                    (query)               (hook)       (component)
```

### 1. Created `listRecentWithEpisodes` Query

**File:** `convex/chapters.ts:331-364`

```typescript
export const listRecentWithEpisodes = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 12 }) => {
    // Get all chapters
    const chapters = await ctx.db.query("chapters").collect();

    // Filter to only chapters with summaries
    const withSummaries = chapters.filter((ch) => ch.summary);

    // Batch fetch unique episodes (avoids N+1)
    const episodeIds = [...new Set(withSummaries.map((c) => c.episodeId))];
    const episodes = await Promise.all(episodeIds.map((id) => ctx.db.get(id)));
    const episodeMap = new Map(
      episodes.filter(Boolean).map((e) => [e!._id, e])
    );

    // Combine, filter orphans, sort by episode date then chapter order
    return withSummaries
      .map((chapter) => ({
        ...chapter,
        duration: chapter.endTime - chapter.startTime,
        episode: episodeMap.get(chapter.episodeId) ?? null,
      }))
      .filter((ch) => ch.episode !== null)
      .sort((a, b) => {
        const aDate = a.episode?.publishedAt ?? 0;
        const bDate = b.episode?.publishedAt ?? 0;
        if (bDate !== aDate) return bDate - aDate;
        return a.orderIndex - b.orderIndex;
      })
      .slice(0, limit);
  },
});
```

**Key decisions:**
- **Filter by summary presence** - Only shows processed chapters
- **Batch episode fetching** - Uses Set + Promise.all to avoid N+1
- **Orphan filtering** - Removes chapters whose episodes were deleted
- **Multi-level sort** - Episode date descending, then chapter order ascending
- **Duration calculation** - Computed on-the-fly from timestamps

### 2. Refactored Homepage with Data Fetching

**File:** `src/app/page.tsx`

Split into three components for clean separation:

```typescript
// ChaptersContent - Uses Convex hooks, renders real data
function ChaptersContent() {
  const chapters = useQuery(api.chapters.listRecentWithEpisodes);
  const isLoading = chapters === undefined;

  // Client-side tag aggregation with useMemo
  const topics = useMemo(() => {
    if (!chapters) return [];
    const counts: Record<string, number> = {};
    chapters.forEach((ch) =>
      (ch.semanticTags ?? []).forEach((tag) => {
        counts[tag] = (counts[tag] ?? 0) + 1;
      })
    );
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }, [chapters]);

  // Transform to ClipCard format
  const clips = chapters?.map((ch) => ({
    _id: ch._id,
    title: ch.title,
    summary: ch.summary ?? "",
    duration: ch.duration,
    topics: ch.semanticTags ?? [],
    guestName: ch.episode?.guestName,
    episode: ch.episode ? {
      title: ch.episode.title,
      episodeNumber: ch.episode.episodeNumber,
    } : null,
  }));

  // Render with loading/empty states
  return (
    <>
      {/* Topic cloud */}
      <div className="flex flex-wrap justify-center gap-2">
        {isLoading ? (
          <SkeletonBadges />
        ) : (
          topics.map((t) => <TopicBadge key={t.name} topic={t.name} count={t.count} />)
        )}
      </div>

      {/* Chapter cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <SkeletonCards />
        ) : clips?.length === 0 ? (
          <EmptyState />
        ) : (
          clips?.map((clip) => <ClipCard key={clip._id} clip={clip} />)
        )}
      </div>
    </>
  );
}

// ConvexContent - Wrapper that checks availability
function ConvexContent() {
  const isAvailable = useConvexAvailable();
  if (!isAvailable) return <FallbackUI />;
  return <ChaptersContent />;
}

// Home - Main page component
export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <ConvexContent />
      <Footer />
    </div>
  );
}
```

### 3. Added Convex Availability Detection

**File:** `src/components/providers/ConvexClientProvider.tsx`

```typescript
const ConvexAvailableContext = createContext<boolean>(false);

export function useConvexAvailable(): boolean {
  return useContext(ConvexAvailableContext);
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url || url === "https://placeholder.convex.cloud") {
      return null;
    }
    return new ConvexReactClient(url);
  }, []);

  if (!client) {
    return (
      <ConvexAvailableContext.Provider value={false}>
        {children}
      </ConvexAvailableContext.Provider>
    );
  }

  return (
    <ConvexAvailableContext.Provider value={true}>
      <ConvexProvider client={client}>{children}</ConvexProvider>
    </ConvexAvailableContext.Provider>
  );
}
```

**Why this pattern:**
- Convex hooks can only be called inside ConvexProvider
- Components using `useQuery` would error without this wrapper
- Context allows components to check availability before using hooks

### 4. Enhanced ClipCard Component

**File:** `src/components/clips/ClipCard.tsx`

Added optional `href` prop for flexible linking:

```typescript
interface ClipCardProps {
  clip: { ... };
  href?: string;  // Optional, no link wrapper if omitted
  showEpisode?: boolean;
}

export function ClipCard({ clip, href, showEpisode = true }: ClipCardProps) {
  const card = (
    <Card className="...">
      {/* card content */}
    </Card>
  );

  if (href) {
    return <Link href={href}>{card}</Link>;
  }
  return card;
}
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Convex Database                          │
│  ┌──────────┐    ┌───────────┐    ┌─────────────────────────┐  │
│  │ episodes │    │ chapters  │    │ transcriptSegments      │  │
│  │ (39+)    │←───│ (500+)    │←───│ (AI summaries/tags)     │  │
│  └──────────┘    └───────────┘    └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              listRecentWithEpisodes Query                       │
│  1. Fetch all chapters                                          │
│  2. Filter → chapters with summary                              │
│  3. Batch fetch → unique episodes                               │
│  4. Join → chapter + episode data                               │
│  5. Sort → by publishedAt DESC, orderIndex ASC                  │
│  6. Limit → 12 chapters                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    React Homepage                               │
│  ┌──────────────────┐  ┌─────────────────────────────────────┐ │
│  │ useQuery(...)    │──│ ChaptersContent                     │ │
│  │ real-time sub    │  │  ├─ useMemo → aggregate tags        │ │
│  └──────────────────┘  │  ├─ map → ClipCard format           │ │
│                        │  └─ render → topic cloud + cards    │ │
│                        └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Homepage UI                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Topic Cloud: [user experience (5)] [innovation (4)] ... │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ Cold Open    │ │ Exploring    │ │ The Role of  │            │
│  │ 2:28         │ │ Poke...      │ │ Personality  │  ... x12   │
│  │ vibe coding  │ │ 4:13         │ │ 2:52         │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## Prevention Strategies

### 1. Wire Up Real Data Immediately

Don't develop UI with placeholder data and defer integration:
- Create queries in parallel with UI components
- Use loading states instead of fake data
- Test with real database from the start

### 2. Establish Query Patterns Early

Create reusable patterns for common operations:
- Batch fetching related entities (chapter → episode)
- Filtering by processing status (has summary)
- Sorting with multiple criteria

### 3. Use Provider Patterns for Optional Dependencies

When a dependency may not be available:
- Create a context to expose availability
- Wrapper components check before using hooks
- Fallback UI for unconfigured states

### 4. Document Data Contracts

Define the shape of data between layers:
- Query return types (TypeScript interfaces)
- Component prop interfaces
- Transformation functions with types

## Test Cases

### Unit Tests

```typescript
describe("listRecentWithEpisodes", () => {
  it("filters chapters without summaries", async () => {
    // Insert chapter without summary
    // Query should return empty array
  });

  it("batch fetches episodes efficiently", async () => {
    // Insert 10 chapters from 3 episodes
    // Verify only 3 episode fetches occur
  });

  it("sorts by episode date then chapter order", async () => {
    // Insert chapters from different episodes
    // Verify ordering is correct
  });
});
```

### Integration Tests

```typescript
describe("Homepage", () => {
  it("renders real chapter data from Convex", async () => {
    // Seed database with chapters
    // Render homepage
    // Verify chapter titles appear
  });

  it("aggregates semantic tags into topic cloud", async () => {
    // Seed chapters with tags
    // Verify tag counts in topic cloud
  });

  it("shows loading skeletons while fetching", async () => {
    // Mock slow query
    // Verify skeleton elements appear
  });
});
```

### E2E Tests (Playwright)

```typescript
test("homepage displays real chapters", async ({ page }) => {
  await page.goto("/");

  // Verify topic cloud renders
  await expect(page.getByText(/user experience \(\d+\)/)).toBeVisible();

  // Verify chapter cards render
  await expect(page.getByRole("heading", { name: "Featured Chapters" })).toBeVisible();
  await expect(page.locator(".grid > div")).toHaveCount(12);
});
```

## Related Documentation

- [PROJECT_SPEC.md](../../PROJECT_SPEC.md) - Full product specification
- [chapter-summary-semantic-tags.md](../ai-integration/chapter-summary-semantic-tags.md) - AI summary generation (PR #9)
- [convex/schema.ts](../../../convex/schema.ts) - Database schema
- [PR #10](https://github.com/nabeelhyatt/hallwaychat/pull/10) - Implementation PR

## Known Limitations

### Performance Concern (P2)

The `listRecentWithEpisodes` query performs a full table scan (`chapters.collect()`) before filtering. This is acceptable for ~500 chapters but will degrade at scale.

**Tracked in:** `todos/013-pending-p2-full-table-scan-chapters-query.md`

**Future fix:** Add `hasSummary: boolean` field with index for efficient filtering.

### Client-Side Tag Aggregation

Topic counts are computed client-side with `useMemo`. This works for 12 chapters but won't reflect global tag counts across all chapters.

**Tracked in:** `todos/017-pending-p3-missing-topic-aggregation-api.md`

**Future fix:** Add `chapters.getTopSemanticTags` query for full aggregation.

## Verification

To verify this solution:

1. **Check data exists:** Visit `/admin` → See imported episodes with chapters
2. **Verify homepage:** Visit `/` → Chapter cards should appear
3. **Check topic cloud:** Tags should show counts matching chapter data
4. **Test loading state:** Refresh page → Brief skeleton animation
5. **Test real-time:** Add summary in admin → Appears on homepage instantly
