import type { Commit } from '../types'

export interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Walk parentId pointers from headId back to root,
 * returning the messages array in chronological order.
 * Pure function — no side effects.
 */
export function reconstructMessages(
  commits: Record<string, Commit>,
  headId: string,
): AnthropicMessage[] {
  const chain: Commit[] = []
  let current: Commit | undefined = commits[headId]

  while (current) {
    // Skip the root placeholder (empty content)
    if (current.content) chain.unshift(current)
    current = current.parentId ? commits[current.parentId] : undefined
  }

  return chain.map(c => ({ role: c.role, content: c.content }))
}

/**
 * Count approximate tokens for a messages array.
 * Rough estimate: 1 token ≈ 4 characters.
 */
export function estimateTokens(messages: AnthropicMessage[]): number {
  const totalChars = messages.reduce((acc, m) => acc + m.content.length, 0)
  return Math.ceil(totalChars / 4)
}
