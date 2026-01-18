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

## Project Structure

```
├── convex/              # Convex backend
│   ├── schema.ts        # Database schema
│   ├── episodes.ts      # Episode queries/mutations
│   ├── clips.ts         # Clip queries/mutations
│   └── topics.ts        # Topic queries/mutations
├── src/
│   ├── app/             # Next.js App Router pages
│   ├── components/      # React components
│   │   ├── clips/       # Clip-related components
│   │   ├── search/      # Search bar and results
│   │   ├── topics/      # Topic badges and cloud
│   │   ├── providers/   # Context providers
│   │   └── ui/          # shadcn/ui components
│   └── lib/             # Utility functions
└── public/              # Static assets
```

## Features (Planned)

- [x] Homepage with search bar and featured clips
- [x] Convex schema for episodes, clips, and topics
- [ ] Semantic search with vector embeddings
- [ ] Clip playback with timestamp control
- [ ] Topic browsing and filtering
- [ ] AI era badges for content dating
- [ ] Dynamic OG images for sharing

## License

MIT
