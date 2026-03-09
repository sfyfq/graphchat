# GitChat

A git-architected LLM chatbot with an infinite canvas UI. Every conversation turn is an immutable commit. Branch from any point, explore alternate threads, and navigate your full conversation history as a zoomable tree — canopy pointing up.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Add your Anthropic API key
cp .env.local.example .env.local
# Edit .env.local and replace sk-ant-... with your real key

# 3. Run
npm run dev
```

Open `http://localhost:5173`.

---

## How to Use

| Action | How |
|--------|-----|
| **Pan** | Click and drag on empty canvas |
| **Zoom** | Scroll / trackpad pinch, or use + − ⊙ buttons |
| **Open a thread** | Click any node |
| **Chat** | Type in the dialog, press Enter to send |
| **Branch** | Click any older node and start chatting — a new branch grows |
| **Search** | ⌘K (or Ctrl+K) |
| **Close dialog** | × button in dialog header |

---

## Architecture

```
src/
  types.ts                    # Commit, Edge, Layout types
  main.tsx / App.tsx          # Root wiring
  store/
    conversationStore.ts      # Zustand store (commits, edges, HEAD)
  lib/
    context.ts                # reconstructMessages() — pure function
    layout.ts                 # Tree layout engine (canopy-up DAG)
    anthropic.ts              # Anthropic API wrapper
    utils.ts                  # timeAgo, truncate, branchColor, etc.
    seeds.ts                  # Demo conversation data
  components/
    Canvas/
      Canvas.tsx              # SVG infinite canvas, pan/zoom
      CommitNode.tsx          # SVG node component
      EdgePath.tsx            # SVG bezier edge
    ChatDialog/
      ChatDialog.tsx          # Draggable overlay dialog
      MessageList.tsx         # Message bubbles
    Search/
      SearchPanel.tsx         # ⌘K full-text search
    Toolbar/
      Toolbar.tsx             # Logo, zoom controls, legend
    Tooltip.tsx               # Hover tooltip
```

### Core Invariant

Context for any node is reconstructed by walking `parentId` pointers from that node back to root:

```ts
reconstructMessages(commits, headId)
// → walks parentId chain → returns messages[] for Anthropic API
```

Branching is free: two nodes with the same `parentId` automatically create a fork in the graph. No special logic required.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_ANTHROPIC_API_KEY` | Your Anthropic API key (`sk-ant-...`) |

⚠️ **Prototype only** — the API key is exposed in the browser bundle via `dangerouslyAllowBrowser: true`. Do not deploy publicly. For production, proxy API calls through a backend.

---

## Build

```bash
npm run build   # outputs to dist/
npm run preview # preview the production build
```
