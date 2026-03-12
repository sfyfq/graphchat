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
 */
export const llm: LLMProvider = {
  get capabilities() {
    const localKey = useConfigStore.getState().apiKey;
    const { idToken } = useAuthStore.getState();
    if (localKey) return geminiProvider.capabilities;
    if (idToken) return proxyProvider.capabilities;
    return mockProvider.capabilities;
  },
  sendMessage: (conv, newText, attachmentIds) => {
    const localKey = useConfigStore.getState().apiKey;
    const { idToken, user } = useAuthStore.getState();

    console.log('[LLM Selector] sendMessage', { 
      hasLocalKey: !!localKey, 
      hasIdToken: !!idToken, 
      hasUser: !!user 
    });

    if (localKey) return geminiProvider.sendMessage(conv, newText, attachmentIds);
    if (idToken) return proxyProvider.sendMessage(conv, newText, attachmentIds);
    
    return mockProvider.sendMessage(conv, newText, attachmentIds);
  },
  streamMessage: (conv, newText, attachmentIds) => {
    const localKey = useConfigStore.getState().apiKey;
    const { idToken, user } = useAuthStore.getState();

    console.log('[LLM Selector] streamMessage', { 
      hasLocalKey: !!localKey, 
      hasIdToken: !!idToken, 
      hasUser: !!user 
    });

    if (localKey) return geminiProvider.streamMessage(conv, newText, attachmentIds);
    if (idToken) return proxyProvider.streamMessage(conv, newText, attachmentIds);

    return mockProvider.streamMessage(conv, newText, attachmentIds);
  }
};

export { geminiProvider, mockProvider, proxyProvider };
export * from './types';
export * from './utils';
