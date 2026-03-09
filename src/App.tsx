import React, {
  useState, useCallback, useEffect, useMemo,
} from 'react'
import { Canvas }      from './components/Canvas/Canvas'
import { ChatDialog }  from './components/ChatDialog/ChatDialog'
import { Tooltip }     from './components/Tooltip'
import { SearchPanel } from './components/Search/SearchPanel'
import { Toolbar }     from './components/Toolbar/Toolbar'
import { useConversationStore } from './store/conversationStore'
import { computeLayout }        from './lib/layout'
import { clamp }                from './lib/utils'
import type { Commit, DialogState } from './types'

export default function App() {
  const { commits, edges, setHEAD } = useConversationStore()

  // Dialogs: map from commitId → position
  const [dialogs,     setDialogs]     = useState<Record<string, { x: number; y: number }>>({})
  const [hoveredId,   setHoveredId]   = useState<string | null>(null)
  const [hoverPos,    setHoverPos]    = useState({ x: 0, y: 0 })
  const [showSearch,  setShowSearch]  = useState(false)

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
  const handleNodeClick = useCallback((commit: Commit, screenX: number, screenY: number) => {
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
      const x = clamp(screenX + 40,  10, window.innerWidth  - 450)
      const y = clamp(screenY - 200, 10, window.innerHeight - 580)
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
    if (commitId) setHoverPos({ x: screenX, y: screenY })
  }, [])

  // ── Close dialog ──────────────────────────────────────────────────────────
  const closeDialog = useCallback((commitId: string) => {
    setDialogs(prev => {
      const next = { ...prev }
      delete next[commitId]
      return next
    })
  }, [])

  // ── Search → open dialog + pan ────────────────────────────────────────────
  const layout = useMemo(() => computeLayout(commits, edges), [commits, edges])

  const handleSearchSelect = useCallback((commit: Commit) => {
    setHEAD(commit.id)
    const x = clamp(window.innerWidth  / 2 + 40, 10, window.innerWidth  - 450)
    const y = clamp(window.innerHeight / 2 - 200, 10, window.innerHeight - 580)
    setDialogs(prev => ({ ...prev, [commit.id]: { x, y } }))
  }, [setHEAD])

  // ── Hovered commit ────────────────────────────────────────────────────────
  const hoveredCommit = hoveredId ? commits[hoveredId] : null
  const showTooltip   = hoveredCommit && !dialogs[hoveredId!]

  const openDialogIds = useMemo(() => new Set(Object.keys(dialogs)), [dialogs])

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#080810' }}>

      {/* Infinite canvas */}
      <Canvas
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        openDialogIds={openDialogIds}
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
