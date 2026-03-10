import { Part } from "@google/generative-ai";

export interface LLMMessage {
  role: 'user' | 'model';
  parts: Part[];
}

export interface LLMProvider {
  /**
   * Standard one-shot message completion.
   */
  sendMessage: (
    history: LLMMessage[],
    newText: string,
  ) => Promise<string>;

  /**
   * Streaming completion.
   */
  streamMessage: (
    history: LLMMessage[],
    newText: string,
  ) => AsyncGenerator<string, void, unknown>;
}
