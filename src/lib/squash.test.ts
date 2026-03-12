import { describe, it, expect } from 'vitest'
import { computeSquashGroups, type SquashGroup } from './squash'
import type { Commit, Edge } from '../types'

describe('computeSquashGroups', () => {
  const createCommit = (id: string, role: 'user' | 'assistant', parentId: string | null = null, branchLabel?: string): Commit => ({
    id,
    role,
    parentId,
    content: `Content for ${id}`,
    summary: `Summary for ${id}`,
    timestamp: Date.now(),
    model: 'test-model',
    branchLabel,
  })

  it('should not squash anything if the chain is too short', () => {
    const commits: Record<string, Commit> = {
      'root': createCommit('root', 'assistant'),
      'u1': createCommit('u1', 'user', 'root'),
      'a1': createCommit('a1', 'assistant', 'u1'),
    }
    const edges: Edge[] = [
      { source: 'root', target: 'u1' },
      { source: 'u1', target: 'a1' },
    ]
    const pinned = new Set<string>()
    const groups = computeSquashGroups(commits, edges, pinned)
    expect(groups.size).toBe(0)
  })

  it('should squash a linear run of user-assistant-user if surrounded by assistants', () => {
    // root (A) -> u1 (U) -> a1 (A) -> u2 (U) -> a2 (A)
    // The run u1-a1-u2 should be squashed.
    const commits: Record<string, Commit> = {
      'root': createCommit('root', 'assistant'),
      'u1': createCommit('u1', 'user', 'root'),
      'a1': createCommit('a1', 'assistant', 'u1'),
      'u2': createCommit('u2', 'user', 'a1'),
      'a2': createCommit('a2', 'assistant', 'u2'),
    }
    const edges: Edge[] = [
      { source: 'root', target: 'u1' },
      { source: 'u1', target: 'a1' },
      { source: 'a1', target: 'u2' },
      { source: 'u2', target: 'a2' },
    ]
    const pinned = new Set<string>()
    const groups = computeSquashGroups(commits, edges, pinned)

    // Expected group: [u1, a1, u2]
    expect(groups.has('u1')).toBe(true)
    expect(groups.has('a1')).toBe(true)
    expect(groups.has('u2')).toBe(true)

    const group = groups.get('u1')!
    expect(group.commits.map(c => c.id)).toEqual(['u1', 'a1', 'u2'])
    expect(group.parentId).toBe('root')
    expect(group.childId).toBe('a2')
  })

  it('should not squash pinned nodes', () => {
    const commits: Record<string, Commit> = {
      'root': createCommit('root', 'assistant'),
      'u1': createCommit('u1', 'user', 'root'),
      'a1': createCommit('a1', 'assistant', 'u1'),
      'u2': createCommit('u2', 'user', 'a1'),
      'a2': createCommit('a2', 'assistant', 'u2'),
    }
    const edges: Edge[] = [
      { source: 'root', target: 'u1' },
      { source: 'u1', target: 'a1' },
      { source: 'a1', target: 'u2' },
      { source: 'u2', target: 'a2' },
    ]
    const pinned = new Set(['a1'])
    const groups = computeSquashGroups(commits, edges, pinned)
    expect(groups.size).toBe(0)
  })

  it('should not squash nodes with branch labels', () => {
    const commits: Record<string, Commit> = {
      'root': createCommit('root', 'assistant'),
      'u1': createCommit('u1', 'user', 'root'),
      'a1': createCommit('a1', 'assistant', 'u1', 'Branch 1'),
      'u2': createCommit('u2', 'user', 'a1'),
      'a2': createCommit('a2', 'assistant', 'u2'),
    }
    const edges: Edge[] = [
      { source: 'root', target: 'u1' },
      { source: 'u1', target: 'a1' },
      { source: 'a1', target: 'u2' },
      { source: 'u2', target: 'a2' },
    ]
    const pinned = new Set<string>()
    const groups = computeSquashGroups(commits, edges, pinned)
    expect(groups.size).toBe(0)
  })

  it('should handle longer squashed chains correctly (must be odd length)', () => {
    // root (A) -> u1 (U) -> a1 (A) -> u2 (U) -> a2 (A) -> u3 (U) -> a3 (A)
    // Run candidate: u1, a1, u2, a2, u3 (Length 5)
    const commits: Record<string, Commit> = {
      'root': createCommit('root', 'assistant'),
      'u1': createCommit('u1', 'user', 'root'),
      'a1': createCommit('a1', 'assistant', 'u1'),
      'u2': createCommit('u2', 'user', 'a1'),
      'a2': createCommit('a2', 'assistant', 'u2'),
      'u3': createCommit('u3', 'user', 'a2'),
      'a3': createCommit('a3', 'assistant', 'u3'),
    }
    const edges: Edge[] = [
      { source: 'root', target: 'u1' },
      { source: 'u1', target: 'a1' },
      { source: 'a1', target: 'u2' },
      { source: 'u2', target: 'a2' },
      { source: 'a2', target: 'u3' },
      { source: 'u3', target: 'a3' },
    ]
    const pinned = new Set<string>()
    const groups = computeSquashGroups(commits, edges, pinned)

    const group = groups.get('u1')!
    expect(group.commits.map(c => c.id)).toEqual(['u1', 'a1', 'u2', 'a2', 'u3'])
    expect(group.commits.length).toBe(5)
  })
})
