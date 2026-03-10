import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LLMMessage, LLMProvider } from './types';

const API_KEY = import.meta.env.VITE_LLM_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// For testing, we use gemini-3.1-flash-lite-preview
const MODEL_NAME = "gemini-2.0-flash-lite-preview-02-05"; // Updated to actual latest flash lite preview name if available, fallback to 2.0 lite

export class GeminiProvider implements LLMProvider {
  private model = genAI.getGenerativeModel({ model: MODEL_NAME });

  async sendMessage(history: LLMMessage[], newText: string): Promise<string> {
    const chat = this.model.startChat({ history });
    const result = await chat.sendMessage(newText);
    const response = await result.response;
    return response.text();
  }

  async* streamMessage(history: LLMMessage[], newText: string): AsyncGenerator<string, void, unknown> {
    const chat = this.model.startChat({ history });
    const result = await chat.sendMessageStream(newText);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      yield chunkText;
    }
  }
}

export const geminiProvider = new GeminiProvider();
