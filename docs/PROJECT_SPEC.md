# Hallway Chat - Podcast Clip Search Platform

## Current Status

**Repository:** https://github.com/nabeelhyatt/hallwaychat

### What's Complete (Phase 1)
- [x] Next.js 14 with App Router and TypeScript
- [x] Convex schema for episodes, clips, transcript segments, and topics
- [x] CRUD queries/mutations for all entities
- [x] Homepage with search bar, clip cards, and topic badges
- [x] shadcn/ui components (button, card, input, badge)
- [x] Placeholder data showing the UI structure

### Setup Required
```bash
cd /Users/nabeelhyatt/Code/hallwaychat
npx convex dev   # Login and create project, populates .env.local
npm run dev      # Open http://localhost:3000
```

### What's Left to Build (Phases 2-7)
- [ ] Transcript import pipeline (SRT parsing from hallwaychat.co)
- [ ] AI clip segmentation with Claude
- [ ] Semantic search with Convex RAG
- [ ] Audio player with timestamp control
- [ ] OG image generation with Gemini
- [ ] Search results and topic pages
- [ ] Vercel deployment

---

## Overview

Build a semantic search platform for the "Hallway Chat" podcast that lets startup founders discover relevant 2-5 minute clips by searching concepts, startups, or topics rather than browsing episodes chronologically.

**Core Value Proposition:** A founder working on "AI doctors" can search that term and find clips where Fraser and Nabeel discussed related concepts like "AI as expert in your life" - even if they never explicitly said "AI doctors."

**Domain:** This will replace the current hallwaychat.co entirely.

## Product Decisions

| Decision | Choice | Notes |
|----------|--------|-------|
| First-time UX | Featured clips curated by hosts | You manually pick "best of" clips for homepage |
| Guest episodes | Tag but include | Mark as "featuring [Guest]" but include in search |
| Outdated content | AI milestone detection | Claude detects model mentions, tags clips with era |
| Episode playback | Both clips and full episodes | Clips primary, full episodes secondary |
| Analytics | Play counts only | Track what gets played, no explicit feedback UI |

## Tech Stack (Confirmed)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript | Best AI coding support, Convex-native |
| Backend/DB | Convex + RAG Component | Real-time by default, built-in vector search |
| Hosting | Vercel | Seamless Next.js deployment |
| Embeddings | Hugging Face or OpenAI text-embedding-3-small | Cost-effective, evaluate both |
| Segmentation | Claude (Sonnet/Haiku) | Identifies topic boundaries, generates metadata |
| Visuals | Google Gemini (Nano Banana Pro) | Image generation for OG cards |
| Audio Player | TBD - see Player Options below | Sleek, modern design |
| Auth | None (open access for MVP) | Simpler launch, add later if needed |

## Data Model

### Convex Schema

```typescript
// convex/schema.ts
episodes: defineTable({
  title: v.string(),
  episodeNumber: v.number(),
  publishedAt: v.number(),
  duration: v.number(),
  audioUrl: v.string(),
  status: v.union(v.literal("draft"), v.literal("processing"), v.literal("published")),
})

clips: defineTable({
  episodeId: v.id("episodes"),
  title: v.string(),           // AI-generated
  summary: v.string(),         // 1-2 sentences
  keyQuote: v.string(),        // Best quotable line
  startTime: v.number(),       // Seconds
  endTime: v.number(),
  duration: v.number(),
  transcript: v.string(),
  topics: v.array(v.string()), // ["ai-strategy", "fundraising"]
  importance: v.number(),      // 0-1 for search ranking
  guestName: v.optional(v.string()),  // "Andrew Mason" if guest episode
  aiEra: v.optional(v.string()),      // "pre-gpt-5", "claude-3-era", etc.
  aiMentions: v.optional(v.array(v.string())), // ["GPT-4", "Claude 3"]
  isFeatured: v.boolean(),     // Manually curated for homepage
  playCount: v.number(),       // Analytics: total plays
})

transcriptSegments: defineTable({
  episodeId: v.id("episodes"),
  clipId: v.optional(v.id("clips")),
  speaker: v.string(),         // "Fraser" or "Nabeel"
  text: v.string(),
  startTime: v.number(),
  endTime: v.number(),
})

topics: defineTable({
  name: v.string(),
  slug: v.string(),
  clipCount: v.number(),
})
```

### RAG Component Setup

```typescript
// convex/rag.ts
export const rag = new RAG(components.rag, {
  textEmbeddingModel: openai.embedding("text-embedding-3-small"),
  embeddingDimension: 1536,
  filterNames: ["episodeId", "topic", "speaker"],
});
```

## Processing Pipeline

### Step 1: Import Episodes & Transcripts

**Data Sources:**
- **RSS Feed:** https://feeds.transistor.fm/hallway-chat (episode metadata, audio URLs)
- **Website:** https://www.hallwaychat.co/episodes/ (transcripts)
- **Design Reference:** https://www.hallwaychat.co (visual design patterns, no clips yet)

**Process:**
- Parse RSS feed for episode metadata (title, date, duration, audio URL)
- Scrape transcripts from hallwaychat.co/episodes/
- Parse with @plussub/srt-vtt-parser if SRT/VTT format
- Extract timestamps and speaker labels
- Store in transcriptSegments table

### Step 2: AI Clip Segmentation

Full transcript → Claude (Sonnet/Haiku) → Identify 2-5 min topic segments

Claude outputs for each clip:
- `title`: Catchy 5-8 word title
- `summary`: 1-2 sentence description
- `keyQuote`: Most quotable line
- `topics`: 2-4 topic tags
- `importance`: 0-1 relevance score
- `startTime/endTime`: Timestamps
- `guestName`: If a guest is speaking (from episode metadata)
- `aiMentions`: Array of AI models/products mentioned (e.g., ["GPT-4", "Claude 3", "Midjourney"])
- `aiEra`: Derived timeline tag (e.g., "pre-gpt-5", "claude-3.5-era")

### Step 3: Generate Embeddings

Clip title + summary + transcript → Hugging Face or OpenAI embedding → Store in RAG

Filter values attached:
- `episodeId` - for episode-specific search
- `topic` - for topic filtering
- `speaker` - for speaker filtering

### Processing Costs (One-Time)

| Item | Cost per Episode | 100 Episodes |
|------|------------------|--------------|
| Embeddings (HuggingFace) | Free tier available | Free |
| Embeddings (OpenAI) | ~$0.002 | $0.20 |
| Claude Segmentation | ~$0.10-0.25 | $10-25 |
| **Total** | ~$0.10-0.25 | ~$10-25 |

## Search Algorithm

```typescript
// Ranking formula
finalScore = (semanticSimilarity * 0.60) + (recencyBoost * 0.25) + (importance * 0.15)

// Recency decays over 1 year
recencyBoost = max(0, 1 - (ageInMs / ONE_YEAR_MS))
```

This ensures:
- Most relevant clips surface first (semantic)
- Newer content gets a boost (recency)
- High-importance insights rank higher (editorial)

## Key Pages

### Homepage (/)
- Hero search bar (prominent, above the fold)
- Featured clips grid (6-12 clips, manually curated by you)
- Topic cloud for browsing
- Latest episodes section
- Brief intro: "Search 39+ episodes by concept, not chronology"

### Search Results (/search?q=...)
- Real-time results as you type
- Topic/episode filters
- Clip cards with preview + play button
- Empty state: "No clips match. Try browsing by topic or check featured clips."
- Results show AI era badge when relevant (e.g., "GPT-4 era")

### Clip Page (/clip/[id])
- Audio player (constrained to clip timestamps)
- Full transcript with synchronized highlighting
- AI era badge if applicable (e.g., "Recorded during Claude 3 era")
- Guest attribution if guest episode (e.g., "featuring Andrew Mason")
- Related clips (same topic or semantically similar)
- Share buttons (Twitter, LinkedIn, copy link)
- "Listen to full episode" link → jumps to clip context

### Topic Page (/topic/[slug])
- All clips tagged with topic
- Sorted by relevance + recency
- Topic description (AI-generated or manual)

### Episode Page (/episode/[id])
- Full episode player (not just clips)
- Visual timeline showing all clips as markers
- Click clip marker → jump to that timestamp
- Episode description and guest info
- Links to Spotify/Apple for native listening

### Episodes Archive (/episodes)
- List of all episodes
- Filter by guest vs host-only
- Search within episode titles

## Visual Generation (Google Gemini - Nano Banana Pro)

Each clip gets a branded OG image at `/api/og/[clipId]`:

- Dark gradient background with brand colors
- Clip title (large, bold)
- Key quote (italic, muted)
- Topic badges
- Duration indicator
- "Hallway Chat" branding

Generated via Google Gemini's Nano Banana Pro image generation, cached in Convex storage.

## Audio Player Options

Choose a sleek, modern podcast player. Options to evaluate:

| Option | Pros | Cons |
|--------|------|------|
| **react-modern-audio-player** | Simple, accessible, flexible. Good customization. | May need styling work |
| **Podkast Audio Player** | Built for podcasts. Volume, skip, loop, shuffle, progress tracking, color themes. | Newer library |
| **AudioCard** | Designed for podcasts + Twitter cards. Responsive. | Limited features |
| **Custom (react-h5-audio-player base)** | Full control, can match exact design. | More dev time |
| **Plyr** | Beautiful default styling, accessible, well-maintained. | Not React-native, needs wrapper |

**Recommendation:** Start with **react-modern-audio-player** or **Plyr** (with React wrapper) for sleek defaults, customize with Tailwind to match brand.

## Directory Structure

```
app/
├── page.tsx                    # Homepage
├── search/page.tsx             # Search results
├── clip/[id]/page.tsx          # Clip detail
├── episode/[id]/page.tsx       # Episode detail
├── topic/[slug]/page.tsx       # Topic browse
├── api/og/[clipId]/route.tsx   # OG image generation
└── layout.tsx

components/
├── search/
│   ├── SearchBar.tsx           # Typeahead search
│   └── SearchResults.tsx
├── clips/
│   ├── ClipCard.tsx            # Preview card
│   ├── ClipPlayer.tsx          # Timestamp-constrained player
│   └── ClipTranscript.tsx
└── topics/
    └── TopicBadge.tsx

convex/
├── schema.ts                   # Data model
├── rag.ts                      # Vector search config
└── functions/
    ├── search.ts               # Search API
    ├── clips.ts                # Clip CRUD
    ├── episodes.ts             # Episode CRUD
    └── importTranscript.ts     # Transcript parsing
```

## Implementation Phases

### Phase 1: Foundation
- [ ] Initialize Next.js 14 + Convex
- [ ] Create schema with all tables
- [ ] Set up RAG component
- [ ] Basic episode/clip API

### Phase 2: Import Pipeline
- [ ] SRT/VTT parser (use @plussub/srt-vtt-parser)
- [ ] Claude clip segmentation action
- [ ] Embedding generation with RAG
- [ ] Simple admin upload form

### Phase 3: Search Experience
- [ ] Semantic search with recency ranking
- [ ] SearchBar with typeahead
- [ ] Search results page
- [ ] Topic filtering

### Phase 4: Playback
- [ ] ClipPlayer component (timestamp-constrained)
- [ ] Clip detail page
- [ ] Synchronized transcript display
- [ ] Share functionality

### Phase 5: Visuals
- [ ] Satori OG image route
- [ ] Brand template design
- [ ] Image caching

### Phase 6: Browse & Discovery
- [ ] Homepage with featured clips
- [ ] Topic pages
- [ ] Episode archive
- [ ] Navigation

### Phase 7: Polish
- [ ] SEO (meta tags, sitemap, structured data)
- [ ] Performance optimization
- [ ] Analytics integration
- [ ] Production deployment

## Critical Files

| File | Purpose |
|------|---------|
| convex/schema.ts | Data model (episodes, clips, segments, topics) |
| convex/rag.ts | Vector search configuration |
| convex/functions/segmentClips.ts | Claude clip identification |
| components/clips/ClipPlayer.tsx | Timestamp-constrained audio |
| app/api/og/[clipId]/route.tsx | Satori image generation |

## Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "convex": "^1.0.0",
    "@convex-dev/rag": "^0.1.0",
    "@anthropic-ai/sdk": "^0.30.0",
    "@ai-sdk/anthropic": "^0.0.1",
    "@plussub/srt-vtt-parser": "^3.0.0",
    "tailwindcss": "^3.0.0",
    "lucide-react": "^0.300.0",
    "react-modern-audio-player": "^2.0.0"
  }
}
```

## Verification Plan

### After Phase 2 (Pipeline)
- Upload a test SRT file
- Verify segments stored correctly
- Trigger segmentation → confirm clips created with titles/summaries
- Check embeddings in RAG component

### After Phase 3 (Search)
- Search for a concept mentioned in clips
- Verify relevant clips returned
- Test topic filtering
- Test typeahead suggestions

### After Phase 4 (Playback)
- Play a clip → audio starts at correct timestamp
- Audio stops at clip end time
- Skip controls stay within bounds
- "Full episode" link works

### After Phase 5 (Visuals)
- Visit /api/og/[clipId] → image renders
- Share clip on Twitter → card preview shows
- Second request returns cached image

### End-to-End
- Search "fundraising strategy"
- Click top result
- Play clip
- Share to Twitter
- Verify card preview looks correct

## Open Questions (Resolved)

| Question | Decision |
|----------|----------|
| Database? | Convex (better real-time, built-in RAG) |
| Vector DB? | Convex RAG component (sufficient for ~100K clips) |
| Frontend? | Next.js (best AI coding support) |
| Visual generation? | Satori (fast, free, reliable) |
| Auth? | None for MVP (open access) |
| Transcript format? | SRT/VTT from Otter.ai/Descript |
| Domain? | Replace hallwaychat.co entirely |
| Guest handling? | Tag with guest name, include in search |
| Outdated content? | AI milestone detection with era badges |
| Full episodes? | Yes, with clips as visual timeline markers |

## AI Era Timeline (for tagging)

Claude will detect model mentions and assign clips to eras:

| Era Name | Trigger Keywords | Approximate Period |
|----------|------------------|-------------------|
| gpt-3-era | GPT-3, davinci | 2020-2022 |
| gpt-4-era | GPT-4, gpt4 | Mar 2023 - Nov 2024 |
| claude-3-era | Claude 3, Sonnet, Opus | Mar 2024 - Jun 2025 |
| opus-4.5-era | Claude Opus 4.5, Opus 4.5 | Jan 2025+ |
| gpt-5-era | GPT-5, o1, o3 | Dec 2024+ |
| claude-4-era | Claude 4, Opus 4 | 2025+ |
| deepseek-era | DeepSeek, DeepSeek-V3, DeepSeek-R1 | Dec 2024+ |
| reasoning-era | Chain of thought, reasoning models, o1, o3, R1 | Late 2024+ |
| llama-era | Llama 2, Llama 3 | 2023+ |
| perplexity-era | Perplexity, Perplexity AI | 2023+ |
| manus-era | Manus, Manus AI | 2025+ |

When displaying: "Recorded during GPT-4 era" (subtle, informational)

## Edge Cases Addressed

- **Empty search results:** Show helpful message + featured clips + topic suggestions
- **Guest clips:** Tagged with guest name, included in search with attribution
- **Outdated content:** AI era badges provide context without manual curation
- **Full episode access:** Episode page has full player with clip timeline overlay
- **Related clips:** Use semantic similarity (same vector space) + same topic fallback
- **Mobile:** Episode links to Spotify/Apple for native experience

## Future Integrations

### Snipd Integration
Explore integration with [Snipd](https://www.snipd.com/blog/how-to-include-podcasts-in-pkm-workflow) for:
- AI-generated highlights and summaries
- Export clips to note-taking apps (Notion, Obsidian, Readwise)
- Personal knowledge management (PKM) workflow integration
- Allow users to save clips to their own Snipd library

## Next Steps After Approval

1. Create GitHub repo (hallwaychat or hallway-chat)
2. Initialize Next.js 14 + Convex project
3. Set up Vercel deployment
4. Begin Phase 1 implementation
5. Scrape episodes from RSS feed and transcripts from hallwaychat.co
