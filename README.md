# Artwall — Luxury Room Art Preview

Upload your artworks → Claude analyzes them → gpt-image-2 generates a luxury room → preview your art on the wall.

## Prerequisites
- Node.js 18+
- Anthropic API Key (claude.ai or platform.anthropic.com)
- OpenAI API Key with gpt-image-2 access (platform.openai.com)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Start server
npm start

# 3. Open browser
open http://localhost:3000
```

## Dev mode (auto-restart)
```bash
npm run dev
```

## How it works
1. Upload 1–10 artwork images
2. Choose orientation per image (landscape / portrait)
3. Choose frame style (Gold / Black / White / Ornate)
4. Choose room style — or let AI pick the best one
5. Click Generate → Claude analyzes → gpt-image-2 renders the room

## Structure
```
luxury-room-app/
├── server.js          # Express backend — calls Claude + OpenAI
├── package.json
├── public/
│   └── index.html     # Frontend UI
└── README.md
```

## API Cost (per generation)
- Claude Sonnet: ~$0.01–0.03 (analysis)
- gpt-image-2 medium 1536×1024: ~$0.08
- Total: ~$0.10 per generation

## Extend
- Add `.env` support: `npm install dotenv` → store keys in `.env`
- Deploy to Railway / Render / Fly.io
- Add history/gallery feature
- Add image compositing to overlay actual artwork onto generated room
