import { geminiProvider } from './gemini';
import { mockProvider }   from './MockProvider';
import { proxyProvider }  from './ProxyProvider';
import { useAuthStore }   from '../../store/authStore';
import { LLMProvider }    from './types';

/**
 * A dynamic LLM provider that switches between the secure proxy 
 * and a mock provider based on the user's whitelist status.
 */
export const llm: LLMProvider = {
  sendMessage: (conv, newText) => {
    const { isWhitelisted, idToken } = useAuthStore.getState();
    const provider = (isWhitelisted && idToken) ? proxyProvider : mockProvider;
    return provider.sendMessage(conv, newText);
  },
  streamMessage: (conv, newText) => {
    const { isWhitelisted, idToken } = useAuthStore.getState();
    const provider = (isWhitelisted && idToken) ? proxyProvider : mockProvider;
    return provider.streamMessage(conv, newText);
  }
};

export { geminiProvider, mockProvider, proxyProvider };
export * from './types';
export * from './utils';
