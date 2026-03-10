import type { Commit } from '../../types'
import type { LLMMessage } from './types'

export interface ReconstructedConversation {
  systemInstruction: string;
  history: LLMMessage[];
}

/**
 * Walk parentId pointers from headId back to root,
 * returning the messages array in chronological order.
 * Format specifically for LLM provider consumption.
 */
export function reconstructMessages(
  commits: Record<string, Commit>,
  headId: string,
): ReconstructedConversation {
  const chain: Commit[] = []
  let current: Commit | undefined = commits[headId]

  while (current) {
    if (current.content) chain.unshift(current)
    current = current.parentId ? commits[current.parentId] : undefined
  }

  let systemInstruction = ""
  let historyStartIdx = 0

  // If the very first message is from assistant, treat it as system instruction
  // to satisfy Gemini's "first message must be user" requirement.
  if (chain.length > 0 && chain[0].role === 'assistant') {
    systemInstruction = chain[0].content
    historyStartIdx = 1
  }

  const history = chain.slice(historyStartIdx).map(c => ({
    role: (c.role === 'assistant' ? 'model' : 'user') as 'model' | 'user',
    parts: [{ text: c.content }]
  }))

  return { systemInstruction, history }
}

/**
 * Count approximate tokens for a conversation.
 */
export function estimateTokens(conv: ReconstructedConversation): number {
  const historyChars = conv.history.reduce((acc, m) => {
    return acc + (m.parts[0]?.text?.length || 0)
  }, 0)
  return Math.ceil((historyChars + conv.systemInstruction.length) / 4)
}
