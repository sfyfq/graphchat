import { create } from 'zustand'

export type Theme = 'light' | 'dark' | 'system'

interface ConfigState {
  apiKey: string | null
  showKeyModal: boolean
  theme: Theme
}

interface ConfigActions {
  setApiKey: (key: string | null) => void
  setShowKeyModal: (show: boolean) => void
  setTheme: (theme: Theme) => void
}

export const useConfigStore = create<ConfigState & ConfigActions>((set) => ({
  // Initialize from env if available, but do NOT persist
  apiKey: (import.meta.env.VITE_LLM_API_KEY as string) || null,
  showKeyModal: false,
  theme: 'system',

  setApiKey: (key) => set({ apiKey: key }),
  setShowKeyModal: (show) => set({ showKeyModal: show }),
  setTheme: (theme) => set({ theme }),
}))
