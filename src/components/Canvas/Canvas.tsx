import React, {
  useRef, useState, useCallback, useEffect, useMemo,
} from 'react'
import { useConversationStore } from '../../store/conversationStore'
import { computeLayout }        from '../../lib/layout'
import { computeSquashGroups, hiddenIds } from '../../lib/squash'
import type { SquashGroup }     from '../../lib/squash'
import { branchColor, clamp }   from '../../lib/utils'
import { CommitNode }           from './CommitNode'
import { EdgePath }             from './EdgePath'
import { SquashNode, SquashTooltip } from './SquashNode'
import type { Commit, Layout }  from '../../types'

const ZOOM_MIN = 0.12
const ZOOM_MAX = 3.0

interface Props {
  onNodeClick:    (commit: Commit, screenX: number, screenY: number) => void
  onNodeHover:    (commitId: string | null, screenX: number, screenY: number) => void
  openDialogIds:  Set<string>
  expandedGroups: Set<string>
  toggleGroup:    (groupId: string) => void
}

export const Canvas: React.FC<Props> = ({
  onNodeClick, onNodeHover, openDialogIds, expandedGroups, toggleGroup
}) => {
  const { commits, edges, HEAD } = useConversationStore()

  const [pan,  setPan]  = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  // Squash hover state (separate from regular node hover)
  const [squashHover, setSquashHover] = useState<{
    group: SquashGroup; screenX: number; screenY: number
  } | null>(null)

  const isPanning   = useRef(false)
  const lastMouse   = useRef({ x: 0, y: 0 })
  const canvasRef   = useRef<HTMLDivElement>(null)
  const initialised = useRef(false)

  // Pinned ids: HEAD + any open dialogs — these are never collapsed
  const pinned = useMemo<Set<string>>(() => {
    const s = new Set(openDialogIds)
    s.add(HEAD)
    return s
  }, [HEAD, openDialogIds])

  // Compute squash groups
  const allGroups = useMemo(
    () => computeSquashGroups(commits, edges, pinned),
    [commits, edges, pinned],
  )

  // Which commit ids are hidden (inside a collapsed group, not the representative)
  const hidden = useMemo(() => {
    // A group is collapsed if it's not in expandedGroups
    const collapsedGroups = new Map<string, SquashGroup>()
    allGroups.forEach((group, memberId) => {
      if (!expandedGroups.has(group.id)) {
        collapsedGroups.set(memberId, group)
      }
    })
    return hiddenIds(collapsedGroups)
  }, [allGroups, expandedGroups])

  // Deduplicated set of group representatives (first commit of each group)
  // ONLY for those that are currently collapsed.
  const collapsedGroupReps = useMemo<Map<string, SquashGroup>>(() => {
    const reps = new Map<string, SquashGroup>()
    allGroups.forEach((group) => {
      if (!expandedGroups.has(group.id)) {
        reps.set(group.id, group)
      }
    })
    return reps
  }, [allGroups, expandedGroups])

  // Layout on the collapsed graph — hidden nodes excluded
  const layout: Layout = useMemo(
    () => computeLayout(commits, edges, hidden),
    [commits, edges, hidden],
  )

  // Active path to HEAD
  const activePath = useMemo<Set<string>>(() => {
    const path = new Set<string>()
    let cur = commits[HEAD]
    while (cur) {
      path.add(cur.id)
      cur = cur.parentId ? commits[cur.parentId] : undefined as any
    }
    return path
  }, [commits, HEAD])

  // Auto-fit on first render
  useEffect(() => {
    if (initialised.current || Object.keys(layout).length === 0) return
    initialised.current = true
    const positions = Object.values(layout)
    const xs = positions.map(p => p.x)
    const ys = positions.map(p => p.y)
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2
    setPan({ x: window.innerWidth / 2 - cx, y: window.innerHeight * 0.52 - cy })
  }, [layout])

  // Pan
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-pan')) return
    isPanning.current = true
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    lastMouse.current = { x: e.clientX, y: e.clientY }
    setPan(p => ({ x: p.x + dx, y: p.y + dy }))
  }, [])

  const stopPan = useCallback(() => { isPanning.current = false }, [])

  // Zoom
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const factor  = e.deltaY < 0 ? 1.08 : 0.93
      const newZoom = clamp(zoom * factor, ZOOM_MIN, ZOOM_MAX)
      const rect    = el.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      setPan(p => ({
        x: mx - (mx - p.x) * (newZoom / zoom),
        y: my - (my - p.y) * (newZoom / zoom),
      }))
      setZoom(newZoom)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoom])

  // Toolbar zoom events
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const action = e.detail as string
      setZoom(z => {
        let newZ = z
        if (action === 'in')    newZ = clamp(z * 1.25, ZOOM_MIN, ZOOM_MAX)
        if (action === 'out')   newZ = clamp(z * 0.8,  ZOOM_MIN, ZOOM_MAX)
        if (action === 'reset') {
          newZ = 1
          const positions = Object.values(layout)
          if (positions.length > 0) {
            const xs = positions.map(p => p.x)
            const ys = positions.map(p => p.y)
            const cx = (Math.min(...xs) + Math.max(...xs)) / 2
            const cy = (Math.min(...ys) + Math.max(...ys)) / 2
            setPan({ x: window.innerWidth / 2 - cx, y: window.innerHeight * 0.52 - cy })
          }
        }
        return newZ
      })
    }
    window.addEventListener('gitchat:zoom', handler as EventListener)
    return () => window.removeEventListener('gitchat:zoom', handler as EventListener)
  }, [layout])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('gitchat:zoom-value', { detail: zoom }))
  }, [zoom])

  // Squash pill hover
  const handleSquashHover = useCallback((
    groupId: string | null,
    screenX: number,
    screenY: number,
  ) => {
    if (!groupId) { setSquashHover(null); return }
    const group = collapsedGroupReps.get(groupId)
    if (group) setSquashHover({ group, screenX, screenY })
  }, [collapsedGroupReps])

  const handleNodeClick = useCallback(
    (commit: Commit, screenX: number, screenY: number) => {
      onNodeClick(commit, screenX, screenY)
    },
    [onNodeClick],
  )

  // Visible edges: skip edges where both endpoints are hidden
  const visibleEdges = useMemo(() => {
    return edges.filter(({ source, target }) => {
      if (hidden.has(target)) return false
      return true
    }).map(({ source, target }) => ({
      // If source is hidden, draw from its group rep
      source: hidden.has(source)
        ? (allGroups.get(source)?.id ?? source)
        : source,
      target,
    }))
  }, [edges, hidden, allGroups])

  return (
    <div
      ref={canvasRef}
      style={{
        position:   'absolute',
        inset:      0,
        cursor:     isPanning.current ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={stopPan}
      onMouseLeave={stopPan}
    >
      <Starfield />

      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>

          {/* Edges */}
          {visibleEdges.map(({ source, target }) => {
            const targetCommit = commits[target]
            const color    = branchColor(targetCommit?.branchLabel)
            const isActive = activePath.has(source) && activePath.has(target)
            return (
              <EdgePath
                key={`${source}-${target}`}
                sourceId={source}
                targetId={target}
                layout={layout}
                isActive={isActive}
                color={color}
              />
            )
          })}

          {/* Regular commit nodes — skip hidden */}
          {Object.values(commits).map(commit => {
            if (hidden.has(commit.id)) return null
            // Also skip if this id is a group rep rendered as a pill
            if (collapsedGroupReps.has(commit.id)) return null

            const pos = layout[commit.id]
            if (!pos) return null
            return (
              <CommitNode
                key={commit.id}
                commit={commit}
                x={pos.x}
                y={pos.y}
                isHEAD={commit.id === HEAD}
                isOpen={openDialogIds.has(commit.id)}
                isExpandedRep={expandedGroups.has(commit.id)}
                onCollapse={toggleGroup}
                zoom={zoom}
                onHover={(id) => onNodeHover(id, 0, 0)}
                onClick={handleNodeClick}
              />
            )
          })}

          {/* Squash pill nodes */}
          {Array.from(collapsedGroupReps.entries()).map(([repId, group]) => {
            const pos = layout[repId]
            if (!pos) return null
            const isActive = group.commits.some(c => activePath.has(c.id))
            return (
              <SquashNode
                key={`squash-${repId}`}
                group={group}
                x={pos.x}
                y={pos.y}
                isActive={isActive}
                expanded={false}
                zoom={zoom}
                onToggle={toggleGroup}
                onHoverGroup={handleSquashHover}
              />
            )
          })}

        </g>
      </svg>

      {/* Squash tooltip (HTML overlay, outside SVG transform) */}
      {squashHover && (
        <SquashTooltip
          group={squashHover.group}
          screenX={squashHover.screenX}
          screenY={squashHover.screenY}
        />
      )}

      <ZoomIndicator zoom={zoom} />
    </div>
  )
}

// ── Starfield ─────────────────────────────────────────────────────────────────
const Starfield: React.FC = () => {
  const stars = useMemo(() => Array.from({ length: 220 }, (_, i) => ({
    id: i,
    x:  Math.random() * 100,
    y:  Math.random() * 100,
    r:  Math.random() * 1.3,
    o:  Math.random() * 0.28 + 0.04,
  })), [])

  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} aria-hidden>
      {stars.map(s => (
        <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill={`rgba(255,255,255,${s.o})`} />
      ))}
    </svg>
  )
}

// ── Zoom indicator ────────────────────────────────────────────────────────────
const ZoomIndicator: React.FC<{ zoom: number }> = ({ zoom }) => (
  <div className="no-pan" style={{
    position: 'fixed', bottom: 20, right: 20,
    fontFamily: "'DM Mono', monospace", fontSize: 11,
    color: 'rgba(255,255,255,0.25)', background: 'rgba(10,10,16,0.8)',
    padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.07)',
    pointerEvents: 'none',
  }}>
    {Math.round(zoom * 100)}%
  </div>
)
