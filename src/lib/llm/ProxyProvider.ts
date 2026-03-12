import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { LLMProvider } from './types'
import { ReconstructedConversation, blobToBase64 } from './utils'
import { useAuthStore, getStorageScope } from '../../store/authStore'
import { useConversationStore } from '../../store/conversationStore'
import { getBlob } from '../storage'

const WORKER_URL = import.meta.env.VITE_WORKER_URL || ''
const MODEL_NAME = "gemini-3.1-flash-lite-preview";

/**
 * Helper to fetch attachments and convert them to Google AI Parts.
 */
async function getAttachmentParts(attachmentIds?: string[]): Promise<Part[]> {
  if (!attachmentIds || attachmentIds.length === 0) return [];
  
  const scope = getStorageScope();
  const { library } = useConversationStore.getState();
  const parts: Part[] = [];

  for (const id of attachmentIds) {
      const att = library[id];
      const blob = await getBlob(scope, id);
      if (att && blob) {
          const base64 = await blobToBase64(blob);
          parts.push({
              inlineData: {
                  data: base64,
                  mimeType: att.type
              }
          });
      }
  }
  return parts;
}

export class ProxyProvider implements LLMProvider {
  capabilities = {
    multimodal: true,
  };

  /**
   * Initialize the official Gemini SDK configured to route through the Proxy Worker.
   */
  private getClient() {
    const { idToken } = useAuthStore.getState()
    
    // The "API Key" here is a placeholder because the Worker injects the real one.
    const genAI = new GoogleGenerativeAI("PROXY_KEY"); 
    
    return genAI.getGenerativeModel({
      model: MODEL_NAME,
    }, {
      baseUrl: WORKER_URL,
      customHeaders: {
        "Authorization": `Bearer ${idToken}`
      }
    });
  }

  async sendMessage(conv: ReconstructedConversation, newText: string, attachmentIds?: string[]): Promise<string> {
    const { setWhitelisted, logout } = useAuthStore.getState()
    const model = this.getClient();

    const attachmentParts = await getAttachmentParts(attachmentIds);
    const promptParts: Part[] = attachmentParts.length > 0 
        ? [...attachmentParts, { text: newText }] 
        : [{ text: newText }];

    try {
      const chat = model.startChat({ 
        history: conv.history,
        systemInstruction: conv.systemInstruction ? { role: 'system', parts: [{ text: conv.systemInstruction }] } : undefined
      });
      const result = await chat.sendMessage(promptParts);
      const response = await result.response;
      
      setWhitelisted(true)
      return response.text();
    } catch (err: any) {
      this.handleError(err, setWhitelisted, logout);
      throw err;
    }
  }

  async* streamMessage(conv: ReconstructedConversation, newText: string, attachmentIds?: string[]): AsyncGenerator<string, void, unknown> {
    const { setWhitelisted, logout } = useAuthStore.getState()
    const model = this.getClient();

    const attachmentParts = await getAttachmentParts(attachmentIds);
    const promptParts: Part[] = attachmentParts.length > 0 
        ? [...attachmentParts, { text: newText }] 
        : [{ text: newText }];

    try {
      const chat = model.startChat({ 
        history: conv.history,
        systemInstruction: conv.systemInstruction ? { role: 'system', parts: [{ text: conv.systemInstruction }] } : undefined
      });
      const result = await chat.sendMessageStream(promptParts);

      // Successfully started streaming
      setWhitelisted(true)

      for await (const chunk of result.stream) {
        yield chunk.text();
      }
    } catch (err: any) {
      this.handleError(err, setWhitelisted, logout);
      throw err;
    }
  }

  private handleError(err: any, setWhitelisted: (val: boolean) => void, logout: () => void) {
    const status = err.message || "";
    if (status.includes('401')) {
      logout();
      throw new Error("AUTH_EXPIRED");
    }
    if (status.includes('403')) {
      setWhitelisted(false);
      throw new Error("UNAUTHORIZED_EMAIL");
    }
  }
}

export const proxyProvider = new ProxyProvider()
