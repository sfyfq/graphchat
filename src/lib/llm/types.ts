import { Part } from "@google/generative-ai";
import { ReconstructedConversation } from "./utils";

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
    attachmentIds?: string[]
  ) => Promise<string>;

  /**
   * Streaming completion.
   */
  streamMessage: (
    conv: ReconstructedConversation,
    newText: string,
    attachmentIds?: string[]
  ) => AsyncGenerator<string, void, unknown>;
}
