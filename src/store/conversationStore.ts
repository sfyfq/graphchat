import { create } from 'zustand'
import type { Commit, Edge } from '../types'
import { SEED_COMMITS, SEED_EDGES } from '../lib/seeds'

interface ConversationStore {
  commits:    Record<string, Commit>
  edges:      Edge[]
  HEAD:       string

  addCommit:  (commit: Commit) => void
  setHEAD:    (id: string) => void
  fork:       (fromId: string, label: string) => void
}

export const useConversationStore = create<ConversationStore>((set) => ({
  commits: SEED_COMMITS,
  edges:   SEED_EDGES,
  HEAD:    'b4', // start at a leaf

  addCommit: (commit) =>
    set((state) => ({
      commits: { ...state.commits, [commit.id]: commit },
      edges:   commit.parentId
        ? [...state.edges, { source: commit.parentId, target: commit.id }]
        : state.edges,
      HEAD: commit.id,
    })),

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
