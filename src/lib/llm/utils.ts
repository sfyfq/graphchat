import type { Commit } from '../../types'
import type { LLMMessage, ThinkingMode } from './types'
import { getBlob } from '../storage'
import { getStorageScope } from '../../store/authStore'
import { useConversationStore } from '../../store/conversationStore'

export interface ReconstructedConversation {
  systemInstruction: string;
  history: LLMMessage[];
}

/**
 * Maps our abstract ThinkingMode to model-specific API parameters.
 * Currently optimized for Gemini 3.1 Flash-Lite.
 */
export function getThinkingConfig(mode: ThinkingMode, model: string): any {
  if (mode === 'auto') return undefined;

  // Gemini 3.x series models
  if (model.includes('gemini-3.')) {
    const config: any = {
      includeThoughts: true // Enable thoughts for auditing
    };
    
    switch (mode) {
      case 'fast':
        config.thinkingLevel = 'minimal';
        break;
      case 'balanced':
        config.thinkingLevel = 'low';
        break;
      case 'deep':
        config.thinkingLevel = 'high';
        break;
    }
    return { thinkingConfig: config };
  }

  // Gemini 2.5 series models (Legacy budget-based)
  if (model.includes('gemini-2.5')) {
    let budget = -1; // Default to dynamic
    switch (mode) {
      case 'fast':
        budget = 0;
        break;
      case 'balanced':
        budget = 4096;
        break;
      case 'deep':
        budget = 32768;
        break;
    }
    return { 
      thinkingConfig: { 
        thinkingBudget: budget,
        includeThoughts: true // Enable thoughts for auditing
      } 
    };
  }

  return undefined;
}

/**
 * Converts a Blob to a base64 string.
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Walk parentId pointers from headId back to root,
 * returning the messages array in chronological order.
 * Format specifically for LLM provider consumption.
 * Supports Multimodal (attachments).
 */
export async function reconstructMessages(
  commits: Record<string, Commit>,
  headId: string,
): Promise<ReconstructedConversation> {
  const chain: Commit[] = []
  let current: Commit | undefined = commits[headId]

  while (current) {
    if (current.content || (current.attachmentIds && current.attachmentIds.length > 0)) {
      chain.unshift(current)
    }
    current = current.parentId ? commits[current.parentId] : undefined
  }

  const scope = getStorageScope()
  const { library } = useConversationStore.getState()

  let systemInstruction = ""
  let historyStartIdx = 0

  // If the very first message is from assistant, treat it as system instruction
  if (chain.length > 0 && chain[0].role === 'assistant') {
    systemInstruction = chain[0].content
    historyStartIdx = 1
  }

  const history: LLMMessage[] = []

  for (const c of chain.slice(historyStartIdx)) {
    const parts: any[] = []
    
    // Add text part if present
    if (c.content) {
      parts.push({ text: c.content })
    }

    // Add attachment parts if present
    if (c.attachmentIds && c.attachmentIds.length > 0) {
      for (const id of c.attachmentIds) {
        const att = library[id]
        if (!att) continue

        const blob = await getBlob(scope, id)
        if (blob) {
          const base64Data = await blobToBase64(blob)
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: att.type
            }
          })
        }
      }
    }

    history.push({
      role: (c.role === 'assistant' ? 'model' : 'user') as 'model' | 'user',
      parts
    })
  }

  return { systemInstruction, history }
}

/**
 * Count approximate tokens for a conversation.
 */
export function estimateTokens(conv: ReconstructedConversation): number {
  const historyChars = conv.history.reduce((acc, m) => {
    return acc + m.parts.reduce((pAcc, p) => {
      if (p.text) return pAcc + p.text.length
      if (p.inlineData) return pAcc + 1000 // Very rough estimate for media
      return pAcc
    }, 0)
  }, 0)
  return Math.ceil((historyChars + conv.systemInstruction.length) / 4)
}
