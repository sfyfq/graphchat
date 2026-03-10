import type { Commit, Edge, Layout } from '../types'

const H_GAP = 160
const V_GAP = 144
const ROOT_ID = 'root'

/**
 * Compute pixel positions for visible nodes only.
 *
 * Pass hiddenIds so the layout collapses the graph correctly:
 * - Hidden nodes are skipped entirely
 * - Edges that pass through hidden nodes are remapped to connect
 *   the nearest visible ancestor → visible descendant directly
 *
 * This means a squash group of 5 nodes contributes only 1 depth level,
 * so HEAD sits directly above the pill with no phantom gap.
 */
export function computeLayout(
  commits:   Record<string, Commit>,
  edges:     Edge[],
  hiddenIds: Set<string> = new Set(),
): Layout {
  if (!commits[ROOT_ID]) return {}

  // ── Build collapsed adjacency ──────────────────────────────────────────────
  // For every edge, if source or target is hidden, walk until we find a
  // visible node on each side. Then add the remapped edge.
  const parentOf: Record<string, string> = {}
  edges.forEach(({ source, target }) => {
    parentOf[target] = source
  })

  // Walk up from a node to find its nearest visible ancestor
  function visibleAncestor(id: string): string {
    let cur = id
    while (hiddenIds.has(cur)) {
      cur = parentOf[cur] ?? ROOT_ID
    }
    return cur
  }

  // Build visible children map
  const children: Record<string, string[]> = {}
  Object.keys(commits).forEach(id => {
    if (!hiddenIds.has(id)) children[id] = []
  })

  edges.forEach(({ source, target }) => {
    if (hiddenIds.has(target)) return          // hidden node — skip
    const visSource = visibleAncestor(source)  // remap hidden source upward
    if (visSource === target) return           // self-loop guard
    if (children[visSource] && !children[visSource].includes(target)) {
      children[visSource].push(target)
    }
  })

  // ── BFS depths on collapsed graph ─────────────────────────────────────────
  const depths: Record<string, number> = {}
  const queue: string[] = [ROOT_ID]
  depths[ROOT_ID] = 0

  while (queue.length > 0) {
    const node = queue.shift()!
    for (const child of (children[node] || [])) {
      if (depths[child] === undefined) {
        depths[child] = depths[node] + 1
        queue.push(child)
      }
    }
  }

  // ── Post-order DFS x positions ────────────────────────────────────────────
  const xPositions: Record<string, number> = {}
  let leafCounter = 0

  function assignX(id: string): number {
    const kids = children[id] || []
    if (kids.length === 0) {
      xPositions[id] = leafCounter * H_GAP
      leafCounter++
      return xPositions[id]
    }
    const childXs = kids.map(assignX)
    xPositions[id] = (childXs[0] + childXs[childXs.length - 1]) / 2
    return xPositions[id]
  }

  assignX(ROOT_ID)

  // Orphaned visible nodes
  Object.keys(commits).forEach(id => {
    if (!hiddenIds.has(id) && xPositions[id] === undefined) {
      xPositions[id] = leafCounter * H_GAP
      leafCounter++
      depths[id] = 0
    }
  })

  const maxDepth = Math.max(0, ...Object.values(depths))

  // ── Final layout: visible nodes only ──────────────────────────────────────
  const layout: Layout = {}
  Object.keys(commits).forEach(id => {
    if (hiddenIds.has(id)) return
    layout[id] = {
      x: xPositions[id] ?? 0,
      y: (maxDepth - (depths[id] ?? 0)) * V_GAP,
    }
  })

  return layout
}

export function buildEdgePath(
  sx: number, sy: number,
  tx: number, ty: number,
): string {
  const midY = (sy + ty) / 2
  return `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`
}
