import type { Commit, Edge } from '../types'

const NOW = Date.now()
const H = 3_600_000

export const SEED_COMMITS: Record<string, Commit> = {
  root: {
    id: 'root', parentId: null, role: 'assistant',
    content: 'How can I help you today?', summary: 'welcome message', branchLabel: 'main',
    timestamp: NOW - H * 6, model: 'gemini-3.0 flash',
  },
  a1: {
    id: 'a1', parentId: 'root', role: 'user',
    content: "Let's explore the nature of consciousness and AI.",
    summary: 'Opening: consciousness & AI',
    branchLabel: 'main', timestamp: NOW - H * 5.8, model: '',
  },
  a2: {
    id: 'a2', parentId: 'a1', role: 'assistant',
    content:
      "Consciousness remains one of the deepest unsolved problems in science and philosophy. The 'hard problem'—why there is subjective experience at all—sits at the boundary of physics and phenomenology. Current AI systems process information and generate responses, but whether that constitutes genuine inner experience is genuinely unknown.",
    summary: 'Hard problem of consciousness',
    timestamp: NOW - H * 5.5, model: 'gemini-3.0 flash',
  },
}

export const SEED_EDGES: Edge[] = [
  { source: 'root', target: 'a1' },
  { source: 'a1', target: 'a2' },
]
