import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Commit } from '../types';
import { reconstructMessages } from './context';

const API_KEY = import.meta.env.VITE_LLM_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Non-streaming sendMessage.
 */
export async function sendMessage(
  commits: Record<string, Commit>,
  headId:  string,
  newText: string,
): Promise<string> {
  const history = reconstructMessages(commits, headId);
  
  // Create chat session with history (excluding the very last prompt which we send via sendMessage)
  const chat = model.startChat({
    history: history,
  });

  const result = await chat.sendMessage(newText);
  const response = await result.response;
  return response.text();
}

/**
 * Streaming version: returns an AsyncGenerator that yields partial text chunks.
 */
export async function* streamMessage(
  commits: Record<string, Commit>,
  headId:  string,
  newText: string,
): AsyncGenerator<string, void, unknown> {
  const history = reconstructMessages(commits, headId);
  
  const chat = model.startChat({
    history: history,
  });

  const result = await chat.sendMessageStream(newText);

  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    yield chunkText;
  }
}
