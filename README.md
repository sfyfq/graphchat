# GraphChat

GraphChat is a git-architected LLM chatbot featuring an infinite canvas UI. By treating every conversation turn as an immutable commit, it allows you to visualize, navigate, and branch your AI interactions as a zoomable tree.

---

## Key Features

- **Infinite Zoomable Canvas**: Navigate your conversation history as a structured DAG (Directed Acyclic Graph) with intuitive pan and zoom controls.
- **Non-Destructive Branching**: Click any historical node to branch off. Explore alternate prompts and alternate AI responses without ever losing your original context.
- **Smart History Squashing**: Long linear conversation runs are automatically squashed into compact pills, keeping your graph clean and readable even as threads grow.
- **Persistent Sidebar Explorer**: Dive into squashed history using a dedicated sidebar. Review turns, highlight nodes on the canvas, or jump back into a specific moment in time.
- **Atomic Transactional Turns**: Conversation turns (User + Assistant) are committed atomically only after a successful response. If a request fails, your message stays in the input field and the graph remains pristine.
- **Real-time Streaming**: Enjoy modern chat UX with word-by-word response streaming.
- **Global Search**: Instantly find any message or summary across all branches using the global search panel (`⌘K` / `Ctrl+K`).
- **Visual Context**: High-visibility "HEAD" markers and unique shaping for root messages ensure you always know where you are in the conversation tree.

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- An LLM API Key (e.g., Gemini, Anthropic, OpenAI)

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   Create a `.env.local` file in the root directory:
   ```bash
   VITE_LLM_API_KEY=your_api_key_here
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## Deployment

### Build for Production

To generate a production-ready bundle:

```bash
npm run build
```

The output will be located in the `dist/` directory, which can be hosted on any static site provider (Vercel, Netlify, GitHub Pages, etc.).

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_LLM_API_KEY` | Your LLM API key |

> [!WARNING]
> **Security Note**: This prototype executes API calls directly from the browser. In a production environment, you should proxy these requests through a backend to keep your API keys secure.

---

## License

This project is licensed under the [MIT License](LICENSE).
