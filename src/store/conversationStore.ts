import { create } from 'zustand'
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware'
import { get, set, del } from 'idb-keyval'
import type { Commit, Edge, ChatSession, Attachment } from '../types'
import { SEED_COMMITS } from '../lib/seeds'
import { saveBlob } from '../lib/storage'
import { getStorageScope } from './authStore'

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

interface ConversationState {
  sessions: Record<string, ChatSession>
  currentSessionId: string
  library: Record<string, Attachment> // Shared attachment library
}

interface ConversationActions {
  // Session Management
  createSession: () => string
  switchSession: (id: string) => void
  deleteSession: (id: string) => void
  renameSession: (id: string, name: string) => void

  // Graph Operations (targets current session)
  addCommit: (commit: Commit) => void
  addTurn:   (user: Commit, assistant: Commit) => void
  setHEAD:   (id: string) => void
  fork:      (fromId: string, label: string) => void

  // Attachment Management
  uploadAttachment: (file: File) => Promise<string>
  addToSession: (sessionId: string, attachmentId: string) => void

  // Multi-user reset
  reset: () => void
}

const createNewSession = (id: string): ChatSession => ({
  id,
  name: 'Untitled Chat',
  commits: { root: SEED_COMMITS.root },
  edges: [],
  HEAD: 'root',
  lastModified: Date.now(),
})

const createInitialState = () => {
  const id = crypto.randomUUID()
  return {
    sessions: { [id]: createNewSession(id) },
    currentSessionId: id,
    library: {},
  }
}

/**
 * A custom storage proxy that dynamically computes the key based on current auth scope.
 */
const dynamicStorage = {
  getItem: async (name: string) => {
    const scope = getStorageScope()
    const key = `${scope}:${name}`
    return storage.getItem(key)
  },
  setItem: async (name: string, value: string) => {
    const scope = getStorageScope()
    const key = `${scope}:${name}`
    await storage.setItem(key, value)
  },
  removeItem: async (name: string) => {
    const scope = getStorageScope()
    const key = `${scope}:${name}`
    await storage.removeItem(key)
  }
}

export const useConversationStore = create<ConversationState & ConversationActions>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      reset: () => set(createInitialState()),

      createSession: () => {
        const id = crypto.randomUUID()
        const newSession = createNewSession(id)
        set((state) => ({
          sessions: { ...state.sessions, [id]: newSession },
          currentSessionId: id,
        }))
        return id
      },

      switchSession: (id) => {
        if (get().sessions[id]) {
          set({ currentSessionId: id })
        }
      },

      deleteSession: (id) => {
        set((state) => {
          const newSessions = { ...state.sessions }
          delete newSessions[id]
          
          let nextId = state.currentSessionId
          if (id === state.currentSessionId) {
            const keys = Object.keys(newSessions)
            if (keys.length > 0) {
              nextId = keys[0]
            } else {
              const freshId = crypto.randomUUID()
              newSessions[freshId] = createNewSession(freshId)
              nextId = freshId
            }
          }
          
          return { sessions: newSessions, currentSessionId: nextId }
        })
      },

      renameSession: (id, name) => {
        set((state) => {
          if (!state.sessions[id]) return state
          return {
            sessions: {
              ...state.sessions,
              [id]: { ...state.sessions[id], name }
            }
          }
        })
      },

      addCommit: (commit) =>
        set((state) => {
          const sid = state.currentSessionId
          const session = state.sessions[sid]
          if (!session) return state

          const newCommits = { ...session.commits, [commit.id]: commit }
          const newEdges = [...session.edges]
          if (commit.parentId) {
            newEdges.push({ source: commit.parentId, target: commit.id })
          }

          return {
            sessions: {
              ...state.sessions,
              [sid]: {
                ...session,
                commits: newCommits,
                edges: newEdges,
                HEAD: commit.id,
                lastModified: Date.now(),
              },
            },
          }
        }),

      addTurn: (user, assistant) =>
        set((state) => {
          const sid = state.currentSessionId
          const session = state.sessions[sid]
          if (!session) return state

          const newCommits = { 
            ...session.commits, 
            [user.id]: user, 
            [assistant.id]: assistant 
          }
          const newEdges = [...session.edges]
          if (user.parentId) {
            newEdges.push({ source: user.parentId, target: user.id })
          }
          newEdges.push({ source: user.id, target: assistant.id })

          // Auto-rename if this is the first turn after root
          let newName = session.name
          if (session.name === 'Untitled Chat' && user.parentId === 'root') {
            newName = assistant.summary || 'New Conversation'
          }

          return {
            sessions: {
              ...state.sessions,
              [sid]: {
                ...session,
                name: newName,
                commits: newCommits,
                edges: newEdges,
                HEAD: assistant.id,
                lastModified: Date.now(),
              },
            },
          }
        }),

      setHEAD: (id) =>
        set((state) => {
          const sid = state.currentSessionId
          const session = state.sessions[sid]
          if (!session || !session.commits[id]) return state
          return {
            sessions: {
              ...state.sessions,
              [sid]: { ...session, HEAD: id }
            }
          }
        }),

      fork: (fromId, label) =>
        set((state) => {
          const sid = state.currentSessionId
          const session = state.sessions[sid]
          if (!session || !session.commits[fromId]) return state

          return {
            sessions: {
              ...state.sessions,
              [sid]: {
                ...session,
                commits: {
                  ...session.commits,
                  [fromId]: { ...session.commits[fromId], branchLabel: label },
                },
                HEAD: fromId,
                lastModified: Date.now(),
              },
            },
          }
        }),

      uploadAttachment: async (file) => {
        const scope = getStorageScope()
        const id = crypto.randomUUID()
        const attachment: Attachment = {
          id,
          name: file.name,
          type: file.type,
          size: file.size,
        }

        // Extract image dimensions
        if (file.type.startsWith('image/')) {
          const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
            const img = new Image()
            img.onload = () => resolve({ width: img.width, height: img.height })
            img.src = URL.createObjectURL(file)
          })
          attachment.width = dimensions.width
          attachment.height = dimensions.height
        }

        // Extract audio/video duration
        if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
          const duration = await new Promise<number>((resolve) => {
            const media = document.createElement(file.type.startsWith('audio/') ? 'audio' : 'video')
            media.onloadedmetadata = () => resolve(media.duration)
            media.src = URL.createObjectURL(file)
          })
          attachment.duration = duration
        }

        // Save blob to separate IndexedDB storage (SCOPED)
        await saveBlob(scope, id, file)

        // Add to library in global state
        set((state) => ({
          library: { ...state.library, [id]: attachment }
        }))

        return id
      },

      addToSession: (sessionId, attachmentId) => {
        // Placeholder
      },
    }),
    {
      name: 'graphchat-storage',
      storage: createJSONStorage(() => dynamicStorage),
      skipHydration: true,
      merge: (persistedState, currentState) => {
        if (!persistedState) return currentState
        // Ensure actions from currentState are preserved while taking data from persistedState
        return { ...currentState, ...(persistedState as any) }
      },
    }
  )
)

// Helper selectors for ease of use
export const useCurrentSession = () => {
  const { sessions, currentSessionId } = useConversationStore()
  return sessions[currentSessionId]
}
