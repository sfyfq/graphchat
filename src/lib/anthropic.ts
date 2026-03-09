import type { Commit } from '../types'

// Mock responses — realistic-feeling placeholder replies for UI development.
// Swap this file for the real Anthropic SDK call when you have an API key.
const MOCK_RESPONSES = [
  "That's a fascinating angle. The tension between structural accounts and phenomenological ones runs through most of philosophy of mind — neither camp has a fully satisfying answer yet.",
  "Building on what you said: the key insight is that these two frameworks aren't necessarily in conflict. They might be describing the same underlying reality at different levels of abstraction.",
  "Interesting. This connects to a broader debate about whether first-person and third-person descriptions can ever fully translate into each other — or whether there's an irreducible gap.",
  "The empirical evidence here is genuinely mixed. Some experiments support this view, while others point in a different direction. The honest answer is that we don't know yet.",
  "I'd push back slightly on the framing. The question assumes a clean distinction that may not hold under scrutiny. When you examine the details, the boundary blurs considerably.",
  "What you're describing sounds like a version of the binding problem — how disparate neural processes give rise to a unified, coherent experience. It's one of the hardest open questions in neuroscience.",
  "That's a good point, and it's worth distinguishing two things that often get conflated: the functional role of a process versus its phenomenal character. They can come apart in interesting ways.",
  "The historical parallel is illuminating. We've been here before with other 'hard problems' — vitalism, the nature of heat — and the resolution usually came from unexpected directions.",
  "Agreed, though I'd add a caveat: the analogy only goes so far. There's something distinctive about the first-person case that resists the usual scientific toolkit, at least as currently conceived.",
  "This is where the debate gets genuinely difficult. The intuition pumps on both sides are compelling, which usually signals that we're missing a key conceptual distinction rather than just evidence.",
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function fakeDelay(): Promise<void> {
  // Simulate network + model latency: 800ms–2200ms
  const ms = 800 + Math.random() * 1400
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function sendMessage(
  _commits: Record<string, Commit>,
  _headId: string,
  _newUserContent: string,
): Promise<string> {
  await fakeDelay()
  return pick(MOCK_RESPONSES)
}
