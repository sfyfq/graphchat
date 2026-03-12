import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { useConfigStore } from '../../store/configStore';
import { useConversationStore } from '../../store/conversationStore';
import { useAuthStore, getStorageScope } from '../../store/authStore';
import { getBlob } from '../storage';
import type { LLMProvider } from './types';
import { ReconstructedConversation, blobToBase64 } from './utils';

// For testing, we use gemini-3.1-flash-lite-preview
const MODEL_NAME = "gemini-3.1-flash-lite-preview";

function getGenAI() {
    const key = useConfigStore.getState().apiKey;
    if (!key) {
        throw new Error("MISSING_API_KEY");
    }
    return new GoogleGenerativeAI(key);
}

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

export class GeminiProvider implements LLMProvider {
    capabilities = {
        multimodal: true,
    };

    async sendMessage(conv: ReconstructedConversation, newText: string, attachmentIds?: string[]): Promise<string> {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            systemInstruction: conv.systemInstruction ? { role: 'system', parts: [{ text: conv.systemInstruction }] } : undefined
        });

        const attachmentParts = await getAttachmentParts(attachmentIds);
        const promptParts: Part[] = attachmentParts.length > 0 
            ? [...attachmentParts, { text: newText }] 
            : [{ text: newText }];

        const chat = model.startChat({ history: conv.history });
        const result = await chat.sendMessage(promptParts);
        const response = await result.response;
        return response.text();
    }

    async* streamMessage(conv: ReconstructedConversation, newText: string, attachmentIds?: string[]): AsyncGenerator<string, void, unknown> {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            systemInstruction: conv.systemInstruction ? { role: 'system', parts: [{ text: conv.systemInstruction }] } : undefined
        });

        const attachmentParts = await getAttachmentParts(attachmentIds);
        const promptParts: Part[] = attachmentParts.length > 0 
            ? [...attachmentParts, { text: newText }] 
            : [{ text: newText }];

        const chat = model.startChat({ history: conv.history });
        const result = await chat.sendMessageStream(promptParts);

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            yield chunkText;
        }
    }
}

export const geminiProvider = new GeminiProvider();
