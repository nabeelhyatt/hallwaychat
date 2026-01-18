# Hallway Chat

Semantic search platform for the Hallway Chat podcast. Lets founders search 39+ episodes by concept rather than browsing chronologically.

## MCP Server Setup

On first run, check if MCP servers are configured properly. If GitHub MCP fails, ask the user to set their `GITHUB_TOKEN` environment variable:

```bash
export GITHUB_TOKEN="ghp_xxxx"  # GitHub Personal Access Token
```

For Vercel MCP, remind user to run `/mcp` to authenticate via OAuth.

## Quick Context

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Backend:** Convex with RAG component for vector search
- **Hosts:** Fraser and Nabeel
- **Domain:** Replaces hallwaychat.co

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
- Convex schema with 5 tables (episodes, clips, transcriptSegments, topics, processingJobs)
- Basic UI components (ClipCard, SearchBar, TopicBadge)
- Next.js app structure

## Development

```bash
npm install
npx convex dev  # Start Convex backend
npm run dev     # Start Next.js frontend
```
