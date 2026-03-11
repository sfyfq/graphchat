import { create } from 'zustand'
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware'
import { get, set, del } from 'idb-keyval'
import { GoogleProfile } from '../types'

// Custom storage engine using idb-keyval for IndexedDB
const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name)
  },
}

interface AuthState {
  user: GoogleProfile | null
  idToken: string | null
  isWhitelisted: boolean
}

interface AuthActions {
  login: (user: GoogleProfile, idToken: string) => void
  logout: () => void
  setWhitelisted: (status: boolean) => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null,
      idToken: null,
      isWhitelisted: false,

      login: (user, idToken) => set({ user, idToken, isWhitelisted: false }),
      logout: () => set({ user: null, idToken: null, isWhitelisted: false }),
      setWhitelisted: (status) => set({ isWhitelisted: status }),
    }),
    {
      name: 'graphchat-auth',
      storage: createJSONStorage(() => storage),
    }
  )
)
