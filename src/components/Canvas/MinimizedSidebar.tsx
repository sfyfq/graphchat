import * as React from 'react'
import { useState } from 'react'
import { DialogState } from '../../types'

interface MinimizedItem extends DialogState {
  color: string
  summary: string
}

interface Props {
  items: Record<string, MinimizedItem>
  onRestore: (commitId: string) => void
}

export const MinimizedSidebar: React.FC<Props> = ({ items, onRestore }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  
  const itemList = Object.values(items)
  if (itemList.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      right: 12,
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      zIndex: 1000,
      padding: '10px 6px',
      background: 'var(--bg-surface)',
      backdropFilter: 'blur(12px)',
      borderRadius: 20,
      border: '1px solid var(--border-secondary)',
      animation: 'sidebar-in 0.3s ease-out'
    }}>
      {itemList.map((item) => (
        <div 
          key={item.commitId}
          style={{ position: 'relative' }}
          onMouseEnter={() => setHoveredId(item.commitId)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <button
            onClick={() => onRestore(item.commitId)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: 'var(--bg-input)',
              border: '1px solid var(--border-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--border-secondary)'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--bg-input)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <span style={{ fontSize: 20 }}>💬</span>
            <div style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: item.color,
              boxShadow: `0 0 6px ${item.color}`
            }} />
          </button>

          {/* Tooltip */}
          {hoveredId === item.commitId && (
            <div style={{
              position: 'absolute',
              right: 'calc(100% + 12px)',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 200,
              background: 'var(--bg-surface-solid)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--border-primary)',
              borderRadius: 12,
              padding: '10px 12px',
              color: 'var(--text-secondary)',
              fontSize: 12,
              lineHeight: 1.4,
              pointerEvents: 'none',
              boxShadow: 'var(--shadow-main)',
              animation: 'tooltip-in 0.15s ease-out'
            }}>
              <div style={{ 
                fontFamily: "'Syne', sans-serif", 
                fontSize: 9, 
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 4
              }}>
                Latest Update
              </div>
              {item.summary}
              {/* Arrow */}
              <div style={{
                position: 'absolute',
                right: -5,
                top: '50%',
                transform: 'translateY(-50%) rotate(45deg)',
                width: 10,
                height: 10,
                background: 'var(--bg-surface-solid)',
                borderRight: '1px solid var(--border-primary)',
                borderTop: '1px solid var(--border-primary)',
              }} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
