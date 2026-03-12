import { GoogleGenerativeAI } from "@google/generative-ai";
import { LLMProvider } from './types'
import { ReconstructedConversation } from './utils'
import { useAuthStore } from '../../store/authStore'

const WORKER_URL = import.meta.env.VITE_WORKER_URL || ''
const MODEL_NAME = "gemini-3.1-flash-lite-preview";

export class ProxyProvider implements LLMProvider {
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

  async sendMessage(conv: ReconstructedConversation, newText: string): Promise<string> {
    const { setWhitelisted, logout } = useAuthStore.getState()
    const model = this.getClient();

    try {
      const chat = model.startChat({ 
        history: conv.history,
        systemInstruction: conv.systemInstruction ? { parts: [{ text: conv.systemInstruction }] } : undefined
      });
      const result = await chat.sendMessage(newText);
      const response = await result.response;
      
      setWhitelisted(true)
      return response.text();
    } catch (err: any) {
      this.handleError(err, setWhitelisted, logout);
      throw err;
    }
  }

  async* streamMessage(conv: ReconstructedConversation, newText: string): AsyncGenerator<string, void, unknown> {
    const { setWhitelisted, logout } = useAuthStore.getState()
    const model = this.getClient();

    try {
      const chat = model.startChat({ 
        history: conv.history,
        systemInstruction: conv.systemInstruction ? { parts: [{ text: conv.systemInstruction }] } : undefined
      });
      const result = await chat.sendMessageStream(newText);

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
