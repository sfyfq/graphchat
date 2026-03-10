import { create } from 'zustand'
import type { Commit, Edge } from '../types'
import { SEED_COMMITS, SEED_EDGES } from '../lib/seeds'

interface ConversationStore {
  commits:    Record<string, Commit>
  edges:      Edge[]
  HEAD:       string

  addCommit:  (commit: Commit) => void
  addTurn:    (user: Commit, assistant: Commit) => void
  setHEAD:    (id: string) => void
  fork:       (fromId: string, label: string) => void
}

export const useConversationStore = create<ConversationStore>((set) => ({
  commits: { root: SEED_COMMITS.root },
  edges:   [],
  HEAD:    'root',

  addCommit: (commit) =>
    set((state) => ({
      commits: { ...state.commits, [commit.id]: commit },
      edges:   commit.parentId
        ? [...state.edges, { source: commit.parentId, target: commit.id }]
        : state.edges,
      HEAD: commit.id,
    })),

  addTurn: (user, assistant) =>
    set((state) => {
      const newCommits = { 
        ...state.commits, 
        [user.id]: user, 
        [assistant.id]: assistant 
      }
      const newEdges = [...state.edges]
      if (user.parentId) {
        newEdges.push({ source: user.parentId, target: user.id })
      }
      newEdges.push({ source: user.id, target: assistant.id })

      return {
        commits: newCommits,
        edges:   newEdges,
        HEAD:    assistant.id
      }
    }),

  setHEAD: (id) => set({ HEAD: id }),

  fork: (fromId, label) =>
    set((state) => ({
      commits: {
        ...state.commits,
        [fromId]: { ...state.commits[fromId], branchLabel: label },
      },
      HEAD: fromId,
    })),
}))
