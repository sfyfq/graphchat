import { create } from 'zustand'
import { ThinkingMode } from '../lib/llm/types'

export type Theme = 'light' | 'dark' | 'system'

interface ConfigState {
  apiKey: string | null
  showKeyModal: boolean
  theme: Theme
  thinkingMode: ThinkingMode
}

interface ConfigActions {
  setApiKey: (key: string | null) => void
  setShowKeyModal: (show: boolean) => void
  setTheme: (theme: Theme) => void
  setThinkingMode: (mode: ThinkingMode) => void
}

export const useConfigStore = create<ConfigState & ConfigActions>((set) => ({
  // Initialize from env if available, but do NOT persist
  apiKey: (import.meta.env.VITE_LLM_API_KEY as string) || null,
  showKeyModal: false,
  theme: 'system',
  thinkingMode: 'balanced',

  setApiKey: (key) => set({ apiKey: key }),
  setShowKeyModal: (show) => set({ showKeyModal: show }),
  setTheme: (theme) => set({ theme }),
  setThinkingMode: (mode) => set({ thinkingMode: mode }),
}))
