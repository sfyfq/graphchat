import type { Commit, Edge } from '../types'

export interface SquashGroup {
  id:       string      // = id of the first (bottom-most) commit in the group
  commits:  Commit[]    // ordered bottom→top (oldest→newest)
  parentId: string | null  // parent of the first commit
  childId:  string | null  // child of the last commit
}

/**
 * Compute which commits can be collapsed into squash groups.
 *
 * A commit is collapsible if:
 *  - it has exactly one parent
 *  - it has exactly one child
 *  - it is not pinned (branch label, HEAD, or open dialog)
 *
 * Adjacent collapsible commits are merged into a single SquashGroup.
 */
const MIN_SIZE = 1

export function computeSquashGroups(
  commits:    Record<string, Commit>,
  edges:      Edge[],
  pinned:     Set<string>,   // HEAD + open dialog ids
): Map<string, SquashGroup> {
  // Build adjacency
  const children: Record<string, string[]> = {}
  const parents:  Record<string, string>   = {}
  Object.keys(commits).forEach(id => { children[id] = [] })
  edges.forEach(({ source, target }) => {
    children[source]?.push(target)
    parents[target] = source
  })

  // Mark collapsible: exactly 1 parent, exactly 1 child, not pinned, not root
  const collapsible = new Set<string>()
  Object.keys(commits).forEach(id => {
    if (id === 'root') return
    if (pinned.has(id)) return
    if (commits[id].branchLabel) return      // branch roots stay visible
    if (children[id].length !== 1) return    // branch points / tips stay visible
    if (!parents[id] || parents[id] === 'root') return
    collapsible.add(id)
  })

  // Walk through commits and group contiguous collapsible runs
  // We BFS from root to maintain order
  const visited = new Set<string>()
  const groups  = new Map<string, SquashGroup>()

  function walkGroup(startId: string): void {
    if (visited.has(startId)) return
    visited.add(startId)

    if (!collapsible.has(startId)) {
      // Not collapsible — recurse into children individually
      children[startId].forEach(child => walkGroup(child))
      return
    }

    // Grow a run upward while still collapsible
    const run: string[] = [startId]
    let cursor = startId
    while (true) {
      const next = children[cursor][0]
      if (!next || !collapsible.has(next) || visited.has(next)) break
      run.push(next)
      visited.add(next)
      cursor = next
    }

    if (run.length >= MIN_SIZE) {
      const group: SquashGroup = {
        id:       run[0],
        commits:  run.map(id => commits[id]),
        parentId: parents[run[0]] ?? null,
        childId:  children[run[run.length - 1]][0] ?? null,
      }
      run.forEach(id => groups.set(id, group))
    }

    // Continue past the end of the run
    const tail = run[run.length - 1]
    children[tail].forEach(child => walkGroup(child))
  }

  // Start from root's children
  children['root']?.forEach(child => walkGroup(child))

  return groups
}

/**
 * Given a squash groups map, return the set of commit ids that are
 * hidden (collapsed inside a group but not the group's representative node).
 */
export function hiddenIds(groups: Map<string, SquashGroup>): Set<string> {
  const hidden = new Set<string>()
  const seen   = new Set<string>()
  groups.forEach((group, memberId) => {
    if (seen.has(group.id)) return
    seen.add(group.id)
    // All members except the first are hidden
    group.commits.slice(1).forEach(c => hidden.add(c.id))
  })
  return hidden
}
