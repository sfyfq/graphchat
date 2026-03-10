import type { Commit } from '../types'
import { reconstructMessages } from './context'

/**
 * Basic non-streaming sendMessage (legacy support)
 */
export async function sendMessage(
  commits: Record<string, Commit>,
  headId:  string,
  newText: string,
): Promise<string> {
  const messages = reconstructMessages(commits, headId)
  
  // Simulation:
  await new Promise(r => setTimeout(r, 1000))
  return `This is a simulated response to: "${newText}"`
}

/**
 * Streaming version: returns an AsyncGenerator that yields partial text chunks.
 */
export async function* streamMessage(
  commits: Record<string, Commit>,
  headId:  string,
  newText: string,
): AsyncGenerator<string, void, unknown> {
  const messages = reconstructMessages(commits, headId)
  
  // Simulation of a streaming AI:
  const dummyResponse = `I've analyzed your thoughts on "${newText.slice(0, 20)}...". Let's explore this deeper. The implications of this branching logic are significant for graph-based state management.`
  const chunks = dummyResponse.split(' ')

  for (const chunk of chunks) {
    await new Promise(r => setTimeout(r, 60)) // simulate network delay
    yield chunk + ' '
  }
}
