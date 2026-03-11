import { LLMProvider } from './types'
import { ReconstructedConversation } from './utils'
import { useAuthStore } from '../../store/authStore'

const WORKER_URL = import.meta.env.VITE_WORKER_URL || ''

export class ProxyProvider implements LLMProvider {
  async sendMessage(conv: ReconstructedConversation, newText: string): Promise<string> {
    const { idToken, setWhitelisted } = useAuthStore.getState()
    
    const response = await fetch(`${WORKER_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ conv, newText })
    })

    if (response.status === 403) {
      setWhitelisted(false)
      throw new Error("UNAUTHORIZED_EMAIL")
    }

    if (!response.ok) {
      const err = await response.text()
      throw new Error(err || "Failed to fetch from proxy")
    }

    const data = await response.json()
    return data.text
  }

  async* streamMessage(conv: ReconstructedConversation, newText: string): AsyncGenerator<string, void, unknown> {
    const { idToken, setWhitelisted } = useAuthStore.getState()

    const response = await fetch(`${WORKER_URL}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ conv, newText })
    })

    if (response.status === 403) {
      setWhitelisted(false)
      throw new Error("UNAUTHORIZED_EMAIL")
    }

    if (!response.ok) {
      const err = await response.text()
      throw new Error(err || "Failed to connect to stream")
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error("No response body")

    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value, { stream: true })
      // Cloudflare Worker will stream raw text chunks
      yield chunk
    }
  }
}

export const proxyProvider = new ProxyProvider()
