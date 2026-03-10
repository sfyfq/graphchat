import type { Commit } from '../types'

export interface LLMMessage {
  role: 'user' | 'model'
  parts: [{ text: string }]
}

/**
 * Walk parentId pointers from headId back to root,
 * returning the messages array in chronological order.
 * Format specifically for Google Gemini SDK.
 */
export function reconstructMessages(
  commits: Record<string, Commit>,
  headId: string,
): LLMMessage[] {
  const chain: Commit[] = []
  let current: Commit | undefined = commits[headId]

  while (current) {
    if (current.content) chain.unshift(current)
    current = current.parentId ? commits[current.parentId] : undefined
  }

  return chain.map(c => ({
    // Gemini uses 'model' instead of 'assistant'
    role: c.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: c.content }]
  }))
}

/**
 * Count approximate tokens for a messages array.
 */
export function estimateTokens(messages: LLMMessage[]): number {
  const totalChars = messages.reduce((acc, m) => acc + m.parts[0].text.length, 0)
  return Math.ceil(totalChars / 4)
}
