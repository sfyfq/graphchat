import React, { useState } from 'react'
import type { SquashGroup } from '../../lib/squash'
import { branchColor, timeAgo, truncate } from '../../lib/utils'

const NODE_R  = 22
const PILL_W  = 72   // half-width of the pill capsule
const PILL_H  = 22   // half-height

interface Props {
  group:    SquashGroup
  x:        number
  y:        number
  isActive: boolean   // any member is on the path to HEAD
  expanded: boolean
  zoom:     number
  onToggle: (groupId: string) => void
  onHoverGroup:  (groupId: string | null, screenX: number, screenY: number) => void
}

export const SquashNode: React.FC<Props> = ({
  group, x, y, isActive, expanded, zoom, onToggle, onHoverGroup,
}) => {
  const count   = group.commits.length
  const bColor  = isActive ? '#6366f1' : 'rgba(255,255,255,0.3)'
  const fill    = isActive ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)'
  const stroke  = isActive ? 'rgba(99,102,241,0.7)'  : 'rgba(255,255,255,0.22)'

  const handleClick = (e: React.MouseEvent<SVGGElement>) => {
    e.stopPropagation()
    onToggle(group.id)
  }

  const handleMouseEnter = (e: React.MouseEvent<SVGGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const sx = rect.left + rect.width / 2
    const sy = rect.top + rect.height / 2
    onHoverGroup(group.id, sx, sy)
  }

  return (
    <g
      transform={`translate(${x},${y})`}
      style={{ cursor: 'pointer' }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => onHoverGroup(null, 0, 0)}
    >
      {/* Active glow */}
      {isActive && (
        <rect
          x={-(PILL_W + 6)} y={-(PILL_H + 6)}
          width={(PILL_W + 6) * 2} height={(PILL_H + 6) * 2}
          rx={PILL_H + 6}
          fill="none"
          stroke="rgba(99,102,241,0.2)"
          strokeWidth={1.5}
        />
      )}

      {/* Pill body */}
      <rect
        x={-PILL_W} y={-PILL_H}
        width={PILL_W * 2} height={PILL_H * 2}
        rx={PILL_H}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
        strokeDasharray="4 2"
      />

      {/* Count badge */}
      <g transform={`translate(${-PILL_W + 18}, 0)`}>
        <circle r={12} fill={isActive ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)'} />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={9}
          fontFamily="'DM Mono', monospace"
          fontWeight="500"
          fill={isActive ? '#a5b4fc' : 'rgba(255,255,255,0.5)'}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          ×{count}
        </text>
      </g>

      {/* Label */}
      <text
        x={8}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={10}
        fontFamily="'DM Mono', monospace"
        fill={isActive ? 'rgba(165,180,252,0.9)' : 'rgba(255,255,255,0.4)'}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {expanded ? 'collapse' : 'squashed'}
      </text>
    </g>
  )
}

// ── Squash tooltip ────────────────────────────────────────────────────────────
interface TooltipProps {
  group:      SquashGroup
  screenX:    number
  screenY:    number
  isExpanded: boolean
  onCollapse: (groupId: string) => void
}

export const SquashTooltip: React.FC<TooltipProps> = ({
  group, isExpanded, onCollapse,
}) => {
  return (
    <div style={{
      position:       'fixed',
      left:           20,
      top:            74,
      background:     'rgba(9,9,15,0.97)',
      border:         '1px solid rgba(255,255,255,0.12)',
      borderRadius:   12,
      padding:        '12px 14px',
      width:          280,
      pointerEvents:  isExpanded ? 'auto' : 'none',
      zIndex:         900,
      backdropFilter: 'blur(16px)',
      boxShadow:      '0 8px 32px rgba(0,0,0,0.7)',
      animation:      'tooltip-in 0.1s ease',
    }}>
      <div style={{
        display:       'flex',
        alignItems:    'center',
        justifyContent: 'space-between',
        marginBottom:  10,
      }}>
        <div style={{
          fontFamily:    "'Syne', sans-serif",
          fontSize:      10,
          color:         'rgba(255,255,255,0.35)',
          textTransform: 'uppercase',
          letterSpacing: '0.09em',
        }}>
          {isExpanded
            ? `${group.commits.length} expanded turns`
            : `${group.commits.length} squashed turns · click to expand`}
        </div>

        {isExpanded && (
          <button
            onClick={() => onCollapse(group.id)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border:     '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%',
              width:      18,
              height:     18,
              display:    'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color:      'rgba(255,255,255,0.5)',
              cursor:     'pointer',
              fontSize:   12,
              padding:    0,
              lineHeight: 1,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Mini timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {group.commits.map((c, i) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
            {/* Dot + line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 3 }}>
              <div style={{
                width:        6,
                height:       6,
                borderRadius: '50%',
                background:   c.role === 'user' ? '#60a5fa' : '#4ade80',
                flexShrink:   0,
              }} />
              {i < group.commits.length - 1 && (
                <div style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.1)', marginTop: 2 }} />
              )}
            </div>
            <div>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize:   11,
                color:      '#ccc',
                lineHeight: 1.4,
              }}>
                {truncate(c.summary || c.content, 55)}
              </div>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize:   9,
                color:      'rgba(255,255,255,0.25)',
                marginTop:  1,
              }}>
                {timeAgo(c.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
