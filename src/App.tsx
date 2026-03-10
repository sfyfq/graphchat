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

  // Which squash groups the user has manually expanded
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Currently focused squash group for the sidebar tooltip
  const [activeSquashGroup, setActiveSquashGroup] = useState<SquashGroup | null>(null)

  // Pinned ids: HEAD + any open dialogs — these are never collapsed
  const openDialogIds = useMemo(() => new Set(Object.keys(dialogs)), [dialogs])
  const pinned = useMemo<Set<string>>(() => {
    const s = new Set(openDialogIds)
    s.add(HEAD)
    // If we have an active squash group (expanded or being hovered),
    // and we're interacting with it via a dialog, pin all its members
    // to prevent the generic squash logic from carving it up.
    if (activeSquashGroup && openDialogIds.size > 0) {
      activeSquashGroup.commits.forEach(c => s.add(c.id))
    }
    return s
  }, [HEAD, openDialogIds, activeSquashGroup?.id]) // depend on id to avoid excessive re-runs

  // Compute squash groups
  const allGroups = useMemo(
    () => computeSquashGroups(commits, edges, pinned),
    [commits, edges, pinned],
  )

  // Sync expandedGroups: if a group ID is no longer in allGroups, remove it
  useEffect(() => {
    // Only sync if no dialogs are open, to keep the UI state stable during interaction
    if (openDialogIds.size > 0) return

    setExpandedGroups(prev => {
      let changed = false
      const next = new Set(prev)
      prev.forEach(id => {
        if (!allGroups.has(id)) {
          next.delete(id)
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [allGroups, openDialogIds.size])

  // Toggle expand/collapse a group
  const toggleGroup = useCallback((groupId: string) => {
    const isExpanding = !expandedGroups.has(groupId)
    
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })

    if (isExpanding) {
      const group = allGroups.get(groupId)
      if (group) {
        // Auto-center on group + parent + child
        const ids = [
          ...group.commits.map(c => c.id),
          group.parentId,
          group.childId
        ].filter(Boolean) as string[]
        
        // Wait for layout to update before fitting
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('gitchat:fit-nodes', { detail: ids }))
        }, 50)
      }
    }
  }, [allGroups, expandedGroups])

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
      const x = clamp(baseSX + 40,  10, window.innerWidth  - 450)
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
    if (group) {
      setActiveSquashGroup(group)
    } else {
      // If the currently active group is NOT expanded, we can hide it on mouse leave.
      // If it IS expanded, we keep it in the sidebar until they click the circled X.
      setActiveSquashGroup(prev => {
        if (prev && expandedGroups.has(prev.id)) return prev
        return null
      })
    }
  }, [expandedGroups])

  const handleCollapseGroup = useCallback((groupId: string) => {
    toggleGroup(groupId)
    setActiveSquashGroup(null)
  }, [toggleGroup])

  const handleSidebarTurnHover = useCallback((id: string | null) => {
    setHoveredId(id)
    setIsHoveringCanvas(false)
  }, [])

  const handleSidebarTurnClick = useCallback((commit: Commit) => {
    handleNodeClick(commit)
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
        expandedGroups={expandedGroups}
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

      {/* Squash sidebar tooltip */}
      {activeSquashGroup && (
        <SquashTooltip
          group={activeSquashGroup}
          screenX={0}
          screenY={0}
          isExpanded={expandedGroups.has(activeSquashGroup.id)}
          onCollapse={handleCollapseGroup}
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
