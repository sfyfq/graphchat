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
 * A commit is candidate for squashing if:
 *  - it has exactly one parent
 *  - it has exactly one child
 *  - it is not pinned (branch label, HEAD, or open dialog)
 */
const MIN_SIZE = 3

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

  // Mark candidate for squashing: exactly 1 parent, exactly 1 child, not pinned, not root
  const candidates = new Set<string>()
  Object.keys(commits).forEach(id => {
    if (id === 'root') return
    if (pinned.has(id)) return
    if (commits[id].branchLabel) return      // branch roots stay visible
    if (children[id].length !== 1) return    // branch points / tips stay visible
    if (!parents[id]) return
    candidates.add(id)
  })

  // Walk through commits and group contiguous candidate runs
  const visited = new Set<string>()
  const groups  = new Map<string, SquashGroup>()

  function walkGroup(startId: string): void {
    if (visited.has(startId)) return
    visited.add(startId)

    if (!candidates.has(startId)) {
      children[startId].forEach(child => walkGroup(child))
      return
    }

    // Grow a contiguous linear run
    const run: string[] = [startId]
    let cursor = startId
    while (true) {
      const next = children[cursor][0]
      if (!next || !candidates.has(next) || visited.has(next)) break
      run.push(next)
      visited.add(next)
      cursor = next
    }

    // Trim run to satisfy constraints:
    // 1. Starts with 'user' node
    // 2. Ends with 'user' node
    // 3. Length is odd
    // 4. Parent is 'assistant'
    // 5. Child is 'assistant'

    let firstIdx = run.findIndex(id => commits[id].role === 'user')
    let lastIdx  = -1
    for (let i = run.length - 1; i >= 0; i--) {
      if (commits[run[i]].role === 'user') {
        lastIdx = i; break
      }
    }

    if (firstIdx !== -1 && lastIdx !== -1 && lastIdx >= firstIdx) {
      let subRun = run.slice(firstIdx, lastIdx + 1)

      // If even length, trim one from the end (must be assistant if alternating)
      // Wait, if it's user -> assistant -> user, length is 3.
      // if it's user -> assistant, length is 2 -> trim to [user], length 1.
      if (subRun.length % 2 === 0) {
        subRun.pop()
      }

      if (subRun.length >= MIN_SIZE) {
        const pId = parents[subRun[0]]
        const cId = children[subRun[subRun.length - 1]][0]

        const pRole = pId ? commits[pId]?.role : null
        const cRole = cId ? commits[cId]?.role : null

        if (pRole === 'assistant' && cRole === 'assistant') {
          const group: SquashGroup = {
            id:       subRun[0],
            commits:  subRun.map(id => commits[id]),
            parentId: pId ?? null,
            childId:  cId ?? null,
          }
          subRun.forEach(id => groups.set(id, group))
        }
      }
    }

    // Continue past the end of the run
    const tail = run[run.length - 1]
    children[tail].forEach(child => walkGroup(child))
  }

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


