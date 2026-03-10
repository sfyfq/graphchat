import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LLMProvider } from './types';
import type { ReconstructedConversation } from './utils';

const API_KEY = import.meta.env.VITE_LLM_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// For testing, we use gemini-3.1-flash-lite-preview
const MODEL_NAME = "gemini-3.1-flash-lite-preview";

export class GeminiProvider implements LLMProvider {
    async sendMessage(conv: ReconstructedConversation, newText: string): Promise<string> {
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            systemInstruction: conv.systemInstruction
        });

        const chat = model.startChat({ history: conv.history });
        const result = await chat.sendMessage(newText);
        const response = await result.response;
        return response.text();
    }

    async* streamMessage(conv: ReconstructedConversation, newText: string): AsyncGenerator<string, void, unknown> {
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            systemInstruction: conv.systemInstruction
        });

        const chat = model.startChat({ history: conv.history });
        const result = await chat.sendMessageStream(newText);

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            yield chunkText;
        }
    }
}

export const geminiProvider = new GeminiProvider();
