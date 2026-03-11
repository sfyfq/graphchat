import { geminiProvider } from './gemini';
import { mockProvider }   from './MockProvider';
import { proxyProvider }  from './ProxyProvider';
import { useAuthStore }   from '../../store/authStore';
import { useConfigStore } from '../../store/configStore';
import { LLMProvider }    from './types';

/**
 * A dynamic LLM provider that switches based on priority:
 * 1. Local API Key (useConfigStore) -> geminiProvider
 * 2. Authenticated Session (useAuthStore) -> proxyProvider
 * 3. Guest -> mockProvider
 * 
 * Note: Authorization (whitelisting) is handled dynamically by the proxyProvider.
 */
export const llm: LLMProvider = {
  sendMessage: (conv, newText) => {
    const localKey = useConfigStore.getState().apiKey;
    if (localKey) return geminiProvider.sendMessage(conv, newText);

    const { idToken } = useAuthStore.getState();
    const provider = idToken ? proxyProvider : mockProvider;
    return provider.sendMessage(conv, newText);
  },
  streamMessage: (conv, newText) => {
    const localKey = useConfigStore.getState().apiKey;
    if (localKey) return geminiProvider.streamMessage(conv, newText);

    const { idToken } = useAuthStore.getState();
    const provider = idToken ? proxyProvider : mockProvider;
    return provider.streamMessage(conv, newText);
  }
};

export { geminiProvider, mockProvider, proxyProvider };
export * from './types';
export * from './utils';
