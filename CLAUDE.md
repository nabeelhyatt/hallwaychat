---
alwaysApply: true
---

# Hallway Chat

Semantic search platform for the Hallway Chat podcast. Lets founders search 39+ episodes by concept rather than browsing chronologically.

## Development Rules (CRITICAL)

- **NEVER COMMIT** unless explicitly asked by the user
- **Always work in feature branches**: Use `nabeelhyatt/*` or `fraser/*` naming convention
- **Branch-first approach**: Never develop directly in main

## MCP Server Setup

On first run, check if MCP servers are configured properly. If GitHub MCP fails, ask the user to set their `GITHUB_TOKEN` environment variable:

```bash
export GITHUB_TOKEN="ghp_xxxx"  # GitHub Personal Access Token
```

For Vercel MCP, remind user to run `/mcp` to authenticate via OAuth.

## Quick Context

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Backend:** Convex with RAG component for vector search
- **Hosts:** Fraser and Nabeel
- **Domain:** Replaces hallwaychat.co
- **Production Convex:** `grateful-tapir-855` (https://grateful-tapir-855.convex.cloud)
- **Issue Tracking:** [GitHub Issues](https://github.com/nabeelhyatt/hallwaychat/issues)

## Key Documentation

See **[docs/PROJECT_SPEC.md](docs/PROJECT_SPEC.md)** for the complete project specification including:
- Product decisions and tech stack rationale
- Full Convex schema (episodes, clips, transcriptSegments, topics)
- Processing pipeline (SRT import → GPT-4 segmentation → embeddings)
- Search algorithm with ranking formula
- All page layouts and features
- Implementation phases with verification plan
- AI era timeline for content dating

## Current State

The project has foundational architecture in place:
- Convex schema with 5 tables (episodes, chapters, clips, transcriptSegments, topics, processingJobs)
- Homepage displays real chapter data with semantic tags
- Admin interface (`/admin`) for importing episodes, transcripts, chapters, and generating AI summaries
- Basic UI components (ClipCard, SearchBar, TopicBadge)
- Next.js app structure

## Development

```bash
npm install
./script/dev    # Starts both Convex and Next.js
```

Or run separately:
```bash
npx convex dev  # Start Convex backend (terminal 1)
npm run dev     # Start Next.js frontend (terminal 2)
```

## Common Commands

```bash
npm install                # Install dependencies
./script/dev               # Start dev servers (Convex + Next.js)
npm run build              # Build for production
npm run lint               # Run ESLint
npx convex deploy          # Deploy Convex to production
npx shadcn add <component> # Add shadcn/ui component
```

## Environment Variables

The `.env.local` file needs:
```bash
CONVEX_DEPLOYMENT=prod:grateful-tapir-855
NEXT_PUBLIC_CONVEX_URL=https://grateful-tapir-855.convex.cloud
```

`OPENAI_API_KEY` is configured in the Convex Dashboard (not local).

## Troubleshooting

**Dev server won't start (lock file or port conflict):**
```bash
pkill -f "next dev"; pkill -f "convex dev"; rm -rf .next
./script/dev
```

This kills stale processes and clears the Next.js cache.

## Files to Exclude from Context

- `node_modules/`, `.next/`, `.convex/`, `dist/`
- `.env*` files (sensitive)
- `*.lock` files
- `convex/_generated/` (auto-generated)
