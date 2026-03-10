import React, {
  useState, useCallback, useEffect, useMemo,
} from 'react'
import { Canvas }      from './components/Canvas/Canvas'
import { ChatDialog }  from './components/ChatDialog/ChatDialog'
import { Tooltip }     from './components/Tooltip'
import { SearchPanel } from './components/Search/SearchPanel'
import { Toolbar }     from './components/Toolbar/Toolbar'
import { SquashTooltip } from './components/Canvas/SquashNode'
import { useConversationStore } from './store/conversationStore'
import { computeLayout }        from './lib/layout'
import { computeSquashGroups, hiddenIds } from './lib/squash'
import type { SquashGroup } from './lib/squash'
import { branchColor, clamp }   from './lib/utils'
import type { Commit, DialogState } from './types'

export default function App() {
  const { commits, edges, HEAD, setHEAD } = useConversationStore()

  // Dialogs: map from commitId → position
  const [dialogs,     setDialogs]     = useState<Record<string, { x: number; y: number }>>({})
  const [hoveredId,   setHoveredId]   = useState<string | null>(null)
  const [hoverPos,    setHoverPos]    = useState({ x: 0, y: 0 })
  const [isHoveringCanvas, setIsHoveringCanvas] = useState(false)
  const [showSearch,  setShowSearch]  = useState(false)

  // Separate states for hover and persistent expansion
  const [hoveredSquashGroup,  setHoveredSquashGroup]  = useState<SquashGroup | null>(null)
  const [expandedSquashGroup, setExpandedSquashGroup] = useState<SquashGroup | null>(null)

  // Pinned ids: HEAD + any open dialogs — these nodes are never part of a squash pill
  const openDialogIds = useMemo(() => new Set(Object.keys(dialogs)), [dialogs])
  const pinned = useMemo<Set<string>>(() => {
    const s = new Set(openDialogIds)
    s.add(HEAD)
    return s
  }, [HEAD, openDialogIds])

  // Compute squash groups based on current pins
  const allGroups = useMemo(
    () => computeSquashGroups(commits, edges, pinned),
    [commits, edges, pinned],
  )

  // Cleanup: if the expanded group's origin node is gone, close the sidebar
  useEffect(() => {
    if (expandedSquashGroup && !commits[expandedSquashGroup.id]) {
      setExpandedSquashGroup(null)
    }
  }, [commits, expandedSquashGroup])

  // Toggle expand/collapse a group
  const toggleGroup = useCallback((groupId: string) => {
    const currentExpandedId = expandedSquashGroup?.id
    const isExpanding = groupId !== currentExpandedId
    
    // Clear ephemeral hover state immediately on click
    setHoveredSquashGroup(null)

    if (isExpanding) {
      const group = allGroups.get(groupId)
      if (group) {
        setExpandedSquashGroup(group)
        // Auto-center on the pill and its boundaries
        const ids = [groupId, group.parentId, group.childId].filter(Boolean) as string[]
        
        // Wait for layout to update before fitting
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('gitchat:fit-nodes', { detail: ids }))
        }, 50)
      }
    } else {
      setExpandedSquashGroup(null)
    }
  }, [allGroups, expandedSquashGroup])

  // Adjacency for finding children
  const childrenMap = useMemo(() => {
    const map: Record<string, string[]> = {}
    edges.forEach(e => {
      if (!map[e.source]) map[e.source] = []
      map[e.source].push(e.target)
    })
    return map
  }, [edges])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(s => !s)
      }
      if (e.key === 'Escape') setShowSearch(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ── Node click → spawn / focus dialog ────────────────────────────────────
  const handleNodeClick = useCallback((commit: Commit, screenX?: number, screenY?: number) => {
    // If clicking a user node, try to set HEAD to its assistant child instead
    let targetHEAD = commit.id
    if (commit.role === 'user') {
      const kids = childrenMap[commit.id] || []
      const assistantKid = kids.find(k => commits[k]?.role === 'assistant')
      if (assistantKid) targetHEAD = assistantKid
    }
    setHEAD(targetHEAD)

    setDialogs(prev => {
      if (prev[commit.id]) {
        // Already open — bring to top by re-inserting at the end
        const { [commit.id]: pos, ...rest } = prev
        return { ...rest, [commit.id]: pos }
      }

      // Spawn: 40px right, 200px above click point, clamped to viewport
      const baseSX = screenX ?? window.innerWidth / 2
      const baseSY = screenY ?? window.innerHeight / 2
      const x = clamp(baseSX + 40,  10, window.innerWidth  - 880)
      const y = clamp(baseSY - 200, 10, window.innerHeight - 580)
      return { ...prev, [commit.id]: { x, y } }
    })
  }, [setHEAD, childrenMap, commits])

  // ── Focus dialog ──────────────────────────────────────────────────────────
  const focusDialog = useCallback((commitId: string) => {
    setDialogs(prev => {
      if (!prev[commitId]) return prev
      const { [commitId]: pos, ...rest } = prev
      return { ...rest, [commitId]: pos }
    })
  }, [])

  // ── Node hover ────────────────────────────────────────────────────────────
  const handleNodeHover = useCallback((
    commitId: string | null,
    screenX:  number,
    screenY:  number,
  ) => {
    setHoveredId(commitId)
    setIsHoveringCanvas(!!commitId)
    if (commitId) setHoverPos({ x: screenX, y: screenY })
  }, [])

  const handleSquashHover = useCallback((
    group:   SquashGroup | null,
    screenX: number,
    screenY: number,
  ) => {
    setHoveredSquashGroup(group)
  }, [])

  const handleCollapseGroup = useCallback(() => {
    setExpandedSquashGroup(null)
  }, [])

  const handleSidebarTurnHover = useCallback((id: string | null) => {
    setHoveredId(id)
    setIsHoveringCanvas(false)
  }, [])

  const handleSidebarTurnClick = useCallback((commit: Commit) => {
    handleNodeClick(commit)
    setExpandedSquashGroup(null) // Close sidebar once a specific node is picked
    // Auto-center on the newly expanded node
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('gitchat:fit-nodes', { detail: [commit.id] }))
    }, 50)
  }, [handleNodeClick])

  // ── Close dialog ──────────────────────────────────────────────────────────
  const closeDialog = useCallback((commitId: string) => {
    setDialogs(prev => {
      const next = { ...prev }
      delete next[commitId]
      return next
    })
  }, [])

  // ── Search → open dialog + pan ────────────────────────────────────────────
  const handleSearchSelect = useCallback((commit: Commit) => {
    setHEAD(commit.id)
    const x = clamp(window.innerWidth  / 2 + 40, 10, window.innerWidth  - 450)
    const y = clamp(window.innerHeight / 2 - 200, 10, window.innerHeight - 580)
    setDialogs(prev => ({ ...prev, [commit.id]: { x, y } }))
  }, [setHEAD])

  // ── Hovered commit ────────────────────────────────────────────────────────
  const hoveredCommit = hoveredId ? commits[hoveredId] : null
  const showTooltip   = hoveredCommit && !dialogs[hoveredId!] && isHoveringCanvas

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#080810' }}>

      {/* Infinite canvas */}
      <Canvas
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        onSquashHover={handleSquashHover}
        openDialogIds={openDialogIds}
        expandedGroups={new Set()}
        toggleGroup={toggleGroup}
        hoveredId={hoveredId}
      />

      {/* Toolbar (logo, search btn, zoom controls, legend) */}
      <Toolbar onSearchOpen={() => setShowSearch(true)} />

      {/* Hover tooltip */}
      {showTooltip && (
        <Tooltip
          commit={hoveredCommit!}
          screenX={hoverPos.x}
          screenY={hoverPos.y}
        />
      )}

      {/* Persistent Expanded Sidebar */}
      {expandedSquashGroup && (
        <SquashTooltip
          group={expandedSquashGroup}
          screenX={0}
          screenY={0}
          isExpanded={true}
          onCollapse={handleCollapseGroup}
          onTurnHover={handleSidebarTurnHover}
          onTurnClick={handleSidebarTurnClick}
          hoveredId={hoveredId}
        />
      )}

      {/* Transient Hover Overlay (only if not already expanded) */}
      {hoveredSquashGroup && hoveredSquashGroup.id !== expandedSquashGroup?.id && (
        <SquashTooltip
          group={hoveredSquashGroup}
          screenX={0}
          screenY={0}
          isExpanded={false}
          onCollapse={() => {}}
          onTurnHover={handleSidebarTurnHover}
          onTurnClick={handleSidebarTurnClick}
          hoveredId={hoveredId}
        />
      )}

      {/* Chat dialogs */}
      {Object.entries(dialogs).map(([commitId, pos]) => {
        const commit = commits[commitId]
        if (!commit) return null
        return (
          <ChatDialog
            key={commitId}
            commit={commit}
            initialPosition={pos}
            onClose={() => closeDialog(commitId)}
            onFocus={() => focusDialog(commitId)}
          />
        )
      })}

      {/* Search panel */}
      {showSearch && (
        <SearchPanel
          commits={commits}
          onSelectCommit={handleSearchSelect}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  )
}
