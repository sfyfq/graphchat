import { GoogleGenerativeAI } from "@google/generative-ai";
import { LLMProvider } from './types'
import { ReconstructedConversation } from './utils'
import { useAuthStore } from '../../store/authStore'

const WORKER_URL = import.meta.env.VITE_WORKER_URL || ''
const MODEL_NAME = "gemini-3.1-flash-lite-preview";

export class ProxyProvider implements LLMProvider {
  private getClient() {
    const { idToken } = useAuthStore.getState()
    const genAI = new GoogleGenerativeAI("PROXY_KEY"); // Key is injected by Worker
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
        systemInstruction: conv.systemInstruction
      });
      const result = await chat.sendMessage(newText);
      const response = await result.response;
      
      setWhitelisted(true)
      return response.text();
    } catch (err: any) {
      if (err.message?.includes('401')) {
        logout();
        throw new Error("AUTH_EXPIRED");
      }
      if (err.message?.includes('403')) {
        setWhitelisted(false);
        throw new Error("UNAUTHORIZED_EMAIL");
      }
      throw err;
    }
  }

  async* streamMessage(conv: ReconstructedConversation, newText: string): AsyncGenerator<string, void, unknown> {
    const { setWhitelisted, logout } = useAuthStore.getState()
    const model = this.getClient();

    try {
      const chat = model.startChat({ 
        history: conv.history,
        systemInstruction: conv.systemInstruction
      });
      const result = await chat.sendMessageStream(newText);

      // Successfully started streaming
      setWhitelisted(true)

      for await (const chunk of result.stream) {
        yield chunk.text();
      }
    } catch (err: any) {
      if (err.message?.includes('401')) {
        logout();
        throw new Error("AUTH_EXPIRED");
      }
      if (err.message?.includes('403')) {
        setWhitelisted(false);
        throw new Error("UNAUTHORIZED_EMAIL");
      }
      throw err;
    }
  }
}

export const proxyProvider = new ProxyProvider()
