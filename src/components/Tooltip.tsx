import React from 'react'
import type { Commit } from '../types'
import { timeAgo, truncate, branchColor } from '../lib/utils'

interface Props {
  commit:    Commit
  screenX:  number
  screenY:  number
}

export const Tooltip: React.FC<Props> = ({ commit, screenX, screenY }) => {
  const bColor = branchColor(commit.branchLabel)

  // Flip left if too close to right edge
  const nearRight = screenX > window.innerWidth - 280
  const left  = nearRight ? screenX - 240 : screenX + 20
  const top   = Math.max(10, screenY - 14)

  return (
    <div
      style={{
        position:       'fixed',
        left:           left,
        top:            top,
        background:     'rgba(9,9,15,0.97)',
        border:         '1px solid rgba(255,255,255,0.12)',
        borderRadius:   11,
        padding:        '11px 14px',
        maxWidth:       250,
        pointerEvents:  'none',
        zIndex:         900,
        backdropFilter: 'blur(16px)',
        boxShadow:      '0 8px 32px rgba(0,0,0,0.7)',
        animation:      'tooltip-in 0.1s ease',
      }}
    >
      {/* Role + time */}
      <div style={{
        fontFamily:    "'Syne', sans-serif",
        fontSize:      10,
        color:         'rgba(255,255,255,0.38)',
        textTransform: 'uppercase',
        letterSpacing: '0.09em',
        marginBottom:  6,
      }}>
        {commit.role} · {timeAgo(commit.timestamp)}
      </div>

      {/* Summary */}
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize:   13,
        color:      '#e2e2e2',
        lineHeight: 1.55,
      }}>
        {commit.summary || truncate(commit.content, 80)}
      </div>

      {/* Branch pill */}
      {commit.branchLabel && (
        <div style={{
          marginTop:    8,
          display:      'inline-block',
          padding:      '2px 9px',
          borderRadius: 20,
          background:   `${bColor}22`,
          border:       `1px solid ${bColor}66`,
          fontFamily:   "'DM Mono', monospace",
          fontSize:     10,
          color:        bColor,
        }}>
          {commit.branchLabel}
        </div>
      )}
    </div>
  )
}
