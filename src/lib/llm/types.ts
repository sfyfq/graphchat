import { Part } from "@google/generative-ai";
import { ReconstructedConversation } from "./utils";

export type ThinkingMode = 'fast' | 'balanced' | 'deep' | 'auto';

export interface LLMMessage {
  role: 'user' | 'model';
  parts: Part[];
}

export interface LLMProvider {
  /**
   * Model capabilities.
   */
  capabilities: {
    multimodal: boolean;
    supportedMimeTypes?: string[];
  };

  /**
   * Standard one-shot message completion.
   */
  sendMessage: (
    conv: ReconstructedConversation,
    newText: string,
    attachmentIds?: string[],
    thinkingMode?: ThinkingMode
  ) => Promise<string>;

  /**
   * Streaming completion.
   */
  streamMessage: (
    conv: ReconstructedConversation,
    newText: string,
    attachmentIds?: string[],
    thinkingMode?: ThinkingMode
  ) => AsyncGenerator<string, void, unknown>;
}
