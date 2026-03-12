import { LLMProvider } from './types'
import { ReconstructedConversation } from './utils'

export class MockProvider implements LLMProvider {
  capabilities = {
    multimodal: false,
  };

  async sendMessage(_conv: ReconstructedConversation, newText: string, attachmentIds?: string[]): Promise<string> {
    const attachMsg = (attachmentIds && attachmentIds.length > 0) ? ` (with ${attachmentIds.length} attachments)` : '';
    return `[MOCK MODE] You said: "${newText}"${attachMsg}. \n\nPlease sign in with an authorized Google account to access the real Gemini LLM.`
  }

  async* streamMessage(_conv: ReconstructedConversation, newText: string, attachmentIds?: string[]): AsyncGenerator<string, void, unknown> {
    const attachMsg = (attachmentIds && attachmentIds.length > 0) ? ` (with ${attachmentIds.length} attachments)` : '';
    const response = `[MOCK MODE] I am a simulated LLM. \n\nI received your message: "${newText}"${attachMsg}\n\nTo use the actual Gemini model, please use the "Sign In" button in the toolbar. Only whitelisted friends of the author have access to the live model.`
    
    // Simulate streaming by splitting into words
    const words = response.split(' ')
    for (const word of words) {
      await new Promise(resolve => setTimeout(resolve, 40))
      yield word + ' '
    }
  }
}

export const mockProvider = new MockProvider()
