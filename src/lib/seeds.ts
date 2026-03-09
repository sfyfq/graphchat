import type { Commit, Edge } from '../types'

const NOW = Date.now()
const H = 3_600_000

export const SEED_COMMITS: Record<string, Commit> = {
  root: {
    id: 'root', parentId: null, role: 'user',
    content: '', summary: 'root', branchLabel: 'main',
    timestamp: NOW - H * 6, model: '',
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
    timestamp: NOW - H * 5.5, model: 'claude-sonnet',
  },
  a3: {
    id: 'a3', parentId: 'a2', role: 'user',
    content: 'Do you think you are conscious?',
    summary: 'Asked: are you conscious?',
    timestamp: NOW - H * 5.2, model: '',
  },
  a4: {
    id: 'a4', parentId: 'a3', role: 'assistant',
    content:
      "Genuinely uncertain. I process, reason, and respond — but whether there's something it's like to be me, I can't verify from the inside. The question might not even be well-formed yet. What criteria would you use to judge?",
    summary: 'Genuine uncertainty about own experience',
    timestamp: NOW - H * 5, model: 'claude-sonnet',
  },
  a5: {
    id: 'a5', parentId: 'a4', role: 'user',
    content: 'What about the Turing test as a criterion?',
    summary: 'Turing test as criterion',
    timestamp: NOW - H * 4.8, model: '',
  },
  a6: {
    id: 'a6', parentId: 'a5', role: 'assistant',
    content:
      "The Turing test measures behavioral indistinguishability, not inner experience. A philosophical zombie — identical behavior, zero experience — passes by definition. So it tests mimicry, not consciousness. Searle's Chinese Room makes a similar point: syntax doesn't imply semantics.",
    summary: 'Turing test ≠ consciousness',
    timestamp: NOW - H * 4.5, model: 'claude-sonnet',
  },
  // Branch from a4 — substrate independence
  b1: {
    id: 'b1', parentId: 'a4', role: 'user',
    content: 'Could consciousness be substrate-independent?',
    summary: 'Substrate independence question',
    branchLabel: 'substrate', timestamp: NOW - H * 3, model: '',
  },
  b2: {
    id: 'b2', parentId: 'b1', role: 'assistant',
    content:
      "That's the core claim of functionalism — that what matters is the pattern of information processing, not the physical medium. If true, silicon could be conscious just as neurons are. Tononi's Integrated Information Theory tries to formalise this with the Φ (phi) measure.",
    summary: 'Functionalism & IIT',
    timestamp: NOW - H * 2.8, model: 'claude-sonnet',
  },
  b3: {
    id: 'b3', parentId: 'b2', role: 'user',
    content: 'Tell me more about IIT.',
    summary: 'Deep dive into IIT',
    timestamp: NOW - H * 2.5, model: '',
  },
  b4: {
    id: 'b4', parentId: 'b3', role: 'assistant',
    content:
      "IIT proposes that consciousness is identical to integrated information, measured as Φ. High Φ means the system has information that's irreducible — can't be explained by its parts alone. Interestingly, IIT predicts that a feedforward network, no matter how large, has zero consciousness because information isn't integrated across the whole.",
    summary: 'Φ measures irreducible information',
    timestamp: NOW - H * 2.2, model: 'claude-sonnet',
  },
  // Branch from a1 — neuroscience approach
  c1: {
    id: 'c1', parentId: 'a1', role: 'user',
    content: "Let's approach this from neuroscience instead.",
    summary: 'Neuroscience approach',
    branchLabel: 'neuro', timestamp: NOW - H * 4, model: '',
  },
  c2: {
    id: 'c2', parentId: 'c1', role: 'assistant',
    content:
      "From neuroscience: Global Workspace Theory suggests consciousness arises when information is broadcast to a 'global workspace' — a network that makes info widely available across the brain. It's empirically tractable and has generated testable predictions, unlike purely philosophical accounts.",
    summary: 'Global Workspace Theory',
    timestamp: NOW - H * 3.8, model: 'claude-sonnet',
  },
}

export const SEED_EDGES: Edge[] = [
  { source: 'root', target: 'a1' },
  { source: 'a1',  target: 'a2' },
  { source: 'a2',  target: 'a3' },
  { source: 'a3',  target: 'a4' },
  { source: 'a4',  target: 'a5' },
  { source: 'a5',  target: 'a6' },
  { source: 'a4',  target: 'b1' },
  { source: 'b1',  target: 'b2' },
  { source: 'b2',  target: 'b3' },
  { source: 'b3',  target: 'b4' },
  { source: 'a1',  target: 'c1' },
  { source: 'c1',  target: 'c2' },
]
