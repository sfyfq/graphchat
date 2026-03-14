import React from 'react'
import { buildEdgePath } from '../../lib/layout'
import type { Layout } from '../../types'

interface Props {
  sourceId:  string
  targetId:  string
  layout:    Layout
  isActive:  boolean   // part of path to HEAD
  color:     string
}

export const EdgePath: React.FC<Props> = ({
  sourceId, targetId, layout, isActive, color,
}) => {
  const s = layout[sourceId]
  const t = layout[targetId]
  if (!s || !t) return null

  const d = buildEdgePath(s.x, s.y, t.x, t.y)

  return (
    <path
      d={d}
      fill="none"
      stroke={isActive ? 'rgba(99,102,241,0.55)' : color}
      strokeWidth={isActive ? 2 : 1.5}
      opacity={isActive ? 1 : 0.5}
      strokeLinecap="round"
      style={{
        transition: 'stroke 0.3s ease, stroke-width 0.3s ease, opacity 0.3s ease'
      }}
    />
  )
}
