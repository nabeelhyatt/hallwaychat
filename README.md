# Hallway Chat - Podcast Clip Search

Search 39+ episodes of Hallway Chat by concept, not chronology. Find relevant clips where Fraser and Nabeel discuss AI, startups, and product development.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Backend/Database**: Convex (with RAG component for vector search)
- **Styling**: Tailwind CSS + shadcn/ui
- **Hosting**: Vercel

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Convex

Run the Convex development server (this will prompt you to log in and create a project):

```bash
npx convex dev
```

This will:
- Create a Convex project
- Generate the `.env.local` file with your `NEXT_PUBLIC_CONVEX_URL`
- Start syncing your schema and functions

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Admin Interface

The `/admin` page provides tools for managing podcast content:

- **Import episodes** from Transistor (podcast host)
- **Import transcripts** from SRT files
- **Import chapters** from Transistor chapter markers
- **Generate AI summaries** for chapters using GPT-4

Access it at [http://localhost:3000/admin](http://localhost:3000/admin) during development.

## Project Structure

```
├── convex/              # Convex backend
│   ├── schema.ts        # Database schema
│   ├── episodes.ts      # Episode queries/mutations
│   ├── clips.ts         # Clip queries/mutations
│   └── topics.ts        # Topic queries/mutations
├── src/
│   ├── app/             # Next.js App Router pages
│   │   └── admin/       # Admin interface for content management
│   ├── components/      # React components
│   │   ├── clips/       # Clip-related components
│   │   ├── search/      # Search bar and results
│   │   ├── topics/      # Topic badges and cloud
│   │   ├── providers/   # Context providers
│   │   └── ui/          # shadcn/ui components
│   └── lib/             # Utility functions
└── public/              # Static assets
```

## Documentation

For the complete project specification, see **[docs/PROJECT_SPEC.md](docs/PROJECT_SPEC.md)**. It includes:

- Product decisions and tech stack rationale
- Full data model with Convex schema
- Processing pipeline (transcript import → AI segmentation → embeddings)
- Search algorithm and ranking formula
- Page layouts and feature specifications
- Implementation phases with verification plan

## Features (Planned)

- [x] Homepage with search bar and featured clips
- [x] Convex schema for episodes, clips, and topics
- [x] Admin interface for content import and AI summarization
- [ ] Semantic search with vector embeddings
- [ ] Clip playback with timestamp control
- [ ] Topic browsing and filtering
- [ ] AI era badges for content dating
- [ ] Dynamic OG images for sharing

Track progress and report issues on [GitHub Issues](https://github.com/nabeelhyatt/hallwaychat/issues).

## AI Development Setup (Claude Code)

This project is configured with MCP servers for enhanced AI assistance:

| Server | Purpose | Setup Required |
|--------|---------|----------------|
| Convex | Database queries, schema info, function execution | Run `npx convex dev` first |
| Vercel | Deployment logs, project management | OAuth via `/mcp` command |
| Context7 | Up-to-date library docs | None (optional API key for higher limits) |
| GitHub | PR/issue management | Set `GITHUB_TOKEN` env var + Docker |

### Quick Start with Claude Code

```bash
# Install Claude Code
npm install -g @anthropic-ai/claude-code

# Start the project
npm run dev
npx convex dev

# Run Claude Code
claude

# Authenticate Vercel MCP (inside Claude Code)
/mcp
```

## License

MIT
