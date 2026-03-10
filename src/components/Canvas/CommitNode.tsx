import React from 'react'
import type { Commit } from '../../types'
import { branchColor } from '../../lib/utils'

const NODE_R = 22

interface Props {
  commit:   Commit
  x:        number
  y:        number
  isHEAD:   boolean
  isOpen:   boolean
  isExpandedRep?: boolean
  onHover:  (id: string | null, screenX: number, screenY: number) => void
  onClick:  (commit: Commit, screenX: number, screenY: number) => void
  onCollapse?: (id: string) => void
  zoom:     number
}

export const CommitNode: React.FC<Props> = ({
  commit, x, y, isHEAD, isOpen, isExpandedRep, onHover, onClick, onCollapse, zoom,
}) => {
  const isRoot      = commit.id === 'root'
  const isUser      = commit.role === 'user'
  const strokeColor = isRoot ? '#f59e0b' : (isUser ? '#3b82f6' : '#10b981')
  const fillOpacity = isHEAD ? 0.22 : 0.10
  const bColor      = branchColor(commit.branchLabel)

  const handleClick = (e: React.MouseEvent<SVGGElement>) => {
    e.stopPropagation()
    const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement)
      .getBoundingClientRect()
    // Convert world coords to screen coords
    const sx = x * zoom + rect.left
    const sy = y * zoom + rect.top
    onClick(commit, sx, sy)
  }

  const handleMouseEnter = (e: React.MouseEvent<SVGGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    // Use the center of the node
    const sx = rect.left + rect.width / 2
    const sy = rect.top + rect.height / 2
    onHover(commit.id, sx, sy)
  }

  const handleCollapse = (e: React.MouseEvent<SVGGElement>) => {
    e.stopPropagation()
    onCollapse?.(commit.id)
  }

  return (
    <g
      transform={`translate(${x},${y})`}
      style={{ cursor: 'pointer' }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => onHover(null, 0, 0)}
    >
      {/* HEAD pulse ring */}
      {isHEAD && (
        <>
          <circle
            r={NODE_R + 12}
            fill="none"
            stroke="rgba(99,102,241,0.2)"
            strokeWidth={1}
          >
            <animate
              attributeName="r"
              values={`${NODE_R + 7};${NODE_R + 16};${NODE_R + 7}`}
              dur="2.4s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.5;0.05;0.5"
              dur="2.4s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            r={NODE_R + 5}
            fill="none"
            stroke="rgba(99,102,241,0.45)"
            strokeWidth={1.5}
          />
        </>
      )}

      {/* Open-dialog ring */}
      {isOpen && !isHEAD && (
        <circle
          r={NODE_R + 5}
          fill="none"
          stroke="rgba(99,102,241,0.3)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      )}

      {/* Node body */}
      {isRoot ? (
        <rect
          x={-NODE_R}
          y={-NODE_R}
          width={NODE_R * 2}
          height={NODE_R * 2}
          rx={8}
          fill={
            isHEAD
              ? `rgba(99,102,241,${fillOpacity})`
              : `rgba(245,158,11,${fillOpacity})`
          }
          stroke={isHEAD ? '#6366f1' : strokeColor}
          strokeWidth={isHEAD ? 2 : 1.5}
        />
      ) : (
        <circle
          r={NODE_R}
          fill={
            isHEAD
              ? `rgba(99,102,241,${fillOpacity})`
              : `rgba(${isUser ? '59,130,246' : '16,185,129'},${fillOpacity})`
          }
          stroke={isHEAD ? '#6366f1' : strokeColor}
          strokeWidth={isHEAD ? 2 : 1.5}
        />
      )}

      {/* Role icon */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={13}
        fontFamily="'DM Mono', monospace"
        fontWeight="500"
        fill="rgba(255,255,255,0.65)"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {isUser ? 'U' : '✦'}
      </text>

      {/* Branch label pill */}
      {commit.branchLabel && (
        <g transform={`translate(0,${NODE_R + 16})`}>
          <rect
            x={-32} y={-9} width={64} height={18} rx={9}
            fill="rgba(8,8,16,0.9)"
            stroke={bColor}
            strokeWidth={1}
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={9}
            fontFamily="'DM Mono', monospace"
            fontWeight="500"
            fill={bColor}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {commit.branchLabel}
          </text>
        </g>
      )}
    </g>
  )
}
