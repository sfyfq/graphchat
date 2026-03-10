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
  const { sessions, currentSessionId, setHEAD } = useConversationStore()
  const currentSession = sessions[currentSessionId]
  
  // Fallback to empty defaults to prevent "undefined" errors during initial load/persist sync
  const commits = currentSession?.commits || {}
  const edges   = currentSession?.edges || []
  const HEAD    = currentSession?.HEAD || 'root'

  // Dialogs: map from commitId → { position, initialInput }
  const [dialogs,     setDialogs]     = useState<Record<string, { x: number; y: number; initialInput?: string }>>({})
  const [hoveredId,   setHoveredId]   = useState<string | null>(null)
  const [hoverPos,    setHoverPos]    = useState({ x: 0, y: 0 })
  const [isHoveringCanvas, setIsHoveringCanvas] = useState(false)
  const [showSearch,  setShowSearch]  = useState(false)

  // Separate states for hover and persistent expansion
  const [hoveredSquashGroup,  setHoveredSquashGroup]  = useState<SquashGroup | null>(null)
  const [expandedSquashGroup, setExpandedSquashGroup] = useState<SquashGroup | null>(null)

  // ── Session Switch Logic ──────────────────────────────────────────────────
  // When the session changes, clear transient UI states
  useEffect(() => {
    setDialogs({})
    setHoveredId(null)
    setHoveredSquashGroup(null)
    setExpandedSquashGroup(null)
    setShowSearch(false)
  }, [currentSessionId])

  // Auto-open root on a FRESH session (one that only has root and no open dialogs)
  useEffect(() => {
    if (Object.keys(commits).length === 1 && commits['root'] && Object.keys(dialogs).length === 0) {
      const width = 860
      const height = 400
      setDialogs({
        root: {
          x: (window.innerWidth - width) / 2,
          y: (window.innerHeight - height) / 2,
          initialInput: ""
        }
      })
    }
  }, [currentSessionId, commits]) // run on session switch or graph reset

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
          window.dispatchEvent(new CustomEvent('graphchat:fit-nodes', { detail: ids }))
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
    let targetHEAD = commit.id
    let initialInput = ""

    if (commit.role === 'user') {
      // "Draft/Edit" mode: move HEAD to parent, pre-fill input
      if (commit.parentId) targetHEAD = commit.parentId
      initialInput = commit.content
    }

    setHEAD(targetHEAD)

    setDialogs(prev => {
      if (prev[commit.id]) {
        // Already open — bring to top
        const { [commit.id]: state, ...rest } = prev
        return { ...rest, [commit.id]: { ...state, initialInput } }
      }

      // New Spawn: center on screen
      const width = 860
      const assumedHeight = 400
      const x = clamp((window.innerWidth - width) / 2, 10, window.innerWidth - (width + 20))
      const y = clamp((window.innerHeight - assumedHeight) / 2, 10, window.innerHeight - 100)
      
      return { ...prev, [commit.id]: { x, y, initialInput } }
    })
  }, [setHEAD])

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
      window.dispatchEvent(new CustomEvent('graphchat:fit-nodes', { detail: [commit.id] }))
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
    handleNodeClick(commit)
  }, [handleNodeClick])

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
      {Object.entries(dialogs).map(([commitId, state]) => {
        const commit = commits[commitId]
        if (!commit) return null
        return (
          <ChatDialog
            key={commitId}
            commit={commit}
            initialPosition={state}
            initialInput={state.initialInput}
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
