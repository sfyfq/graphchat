import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { LLMProvider, ThinkingMode } from './types'
import { ReconstructedConversation, blobToBase64, getThinkingConfig } from './utils'
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
  private getClient(thinkingMode: ThinkingMode = 'auto') {
    const { idToken } = useAuthStore.getState()
    const thinkingConfig = getThinkingConfig(thinkingMode, MODEL_NAME);
    
    // The "API Key" here is a placeholder because the Worker injects the real one.
    const genAI = new GoogleGenerativeAI("PROXY_KEY"); 
    
    return genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: thinkingConfig
    } as any, {
      baseUrl: WORKER_URL,
      customHeaders: {
        "Authorization": `Bearer ${idToken}`
      }
    });
  }

  async sendMessage(
    conv: ReconstructedConversation, 
    newText: string, 
    attachmentIds?: string[],
    thinkingMode: ThinkingMode = 'auto'
  ): Promise<string> {
    const { setWhitelisted, logout } = useAuthStore.getState()
    const model = this.getClient(thinkingMode);

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
      
      // Audit Logging
      console.log("[Audit] Response Metadata:", response.usageMetadata);
      response.candidates?.[0].content.parts.forEach((part: any) => {
        if (part.thought) {
          console.log("[Audit] Model Thought:", part.text);
        }
      });

      setWhitelisted(true)
      return response.text();
    } catch (err: any) {
      this.handleError(err, setWhitelisted, logout);
      throw err;
    }
  }

  async* streamMessage(
    conv: ReconstructedConversation, 
    newText: string, 
    attachmentIds?: string[],
    thinkingMode: ThinkingMode = 'auto'
  ): AsyncGenerator<string, void, unknown> {
    const { setWhitelisted, logout } = useAuthStore.getState()
    const model = this.getClient(thinkingMode);

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

      // After stream finishes, log thoughts and metadata
      result.response.then(res => {
        console.log("[Audit] Final Stream Metadata:", res.usageMetadata);
        res.candidates?.[0].content.parts.forEach((part: any) => {
          if (part.thought) {
            console.log("[Audit] Model Thought (Stream):", part.text);
          }
        });
      }).catch(() => {});

    } catch (err: any) {
      this.handleError(err, setWhitelisted, logout);
      throw err;
    }
  }

  private handleError(err: any, setWhitelisted: (val: boolean) => void, logout: () => void) {
    const message = err.message || "";
    const status = err.status;

    // 1. Check for Unauthorized (401)
    if (status === 401 || /\b401\b/.test(message)) {
      logout();
      throw new Error("AUTH_EXPIRED");
    }

    // 2. Check for Forbidden/Whitelisting (403)
    if (status === 403 || /\b403\b/.test(message)) {
      setWhitelisted(false);
      throw new Error("UNAUTHORIZED_EMAIL");
    }

    // 3. Check for Payload Too Large (413)
    if (status === 413 || /\b413\b/.test(message)) {
      throw new Error("PAYLOAD_TOO_LARGE");
    }
  }
}

export const proxyProvider = new ProxyProvider()
