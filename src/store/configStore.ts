import { create } from 'zustand'

interface ConfigState {
  apiKey: string | null
  showKeyModal: boolean
}

interface ConfigActions {
  setApiKey: (key: string | null) => void
  setShowKeyModal: (show: boolean) => void
}

export const useConfigStore = create<ConfigState & ConfigActions>((set) => ({
  // Initialize from env if available, but do NOT persist
  apiKey: (import.meta.env.VITE_LLM_API_KEY as string) || null,
  showKeyModal: false,

  setApiKey: (key) => set({ apiKey: key }),
  setShowKeyModal: (show) => set({ showKeyModal: show }),
}))
