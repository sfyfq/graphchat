import { GoogleGenerativeAI } from "@google/generative-ai";
import { useConfigStore } from '../../store/configStore';
import type { LLMProvider } from './types';
import type { ReconstructedConversation } from './utils';

// For testing, we use gemini-3.1-flash-lite-preview
const MODEL_NAME = "gemini-3.1-flash-lite-preview";

function getGenAI() {
    const key = useConfigStore.getState().apiKey;
    if (!key) {
        throw new Error("MISSING_API_KEY");
    }
    return new GoogleGenerativeAI(key);
}

export class GeminiProvider implements LLMProvider {
    async sendMessage(conv: ReconstructedConversation, newText: string): Promise<string> {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            systemInstruction: conv.systemInstruction ? { parts: [{ text: conv.systemInstruction }] } : undefined
        });

        const chat = model.startChat({ history: conv.history });
        const result = await chat.sendMessage(newText);
        const response = await result.response;
        return response.text();
    }

    async* streamMessage(conv: ReconstructedConversation, newText: string): AsyncGenerator<string, void, unknown> {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            systemInstruction: conv.systemInstruction ? { parts: [{ text: conv.systemInstruction }] } : undefined
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
