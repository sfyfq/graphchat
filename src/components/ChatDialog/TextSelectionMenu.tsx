import React from 'react'

interface Props {
  x: number
  y: number
  isBelow: boolean
  onAction: (type: 'explain' | 'ask') => void
  onClose: () => void
}

export const TextSelectionMenu: React.FC<Props> = ({ x, y, isBelow, onAction, onClose }) => {
  return (
    <div
      style={{
        position:       'fixed',
        left:           x,
        top:            y,
        transform:      isBelow 
          ? 'translate(-50%, 10px)' 
          : 'translate(-50%, -100%) translateY(-10px)',
        background:     'var(--bg-surface-solid)',
        border:         '1px solid var(--border-primary)',
        borderRadius:   10,
        padding:        '4px',
        display:        'flex',
        gap:            4,
        zIndex:         2000,
        backdropFilter: 'blur(12px)',
        boxShadow:      'var(--shadow-main)',
        animation:      isBelow ? 'tooltip-in-below 0.15s ease-out' : 'tooltip-in 0.15s ease-out',
      }}
    >
      <button
        onClick={() => onAction('explain')}
        style={buttonStyle}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span style={{ fontSize: 14 }}>🔍</span>
        <span>Explain</span>
      </button>

      <div style={{ width: 1, background: 'var(--border-secondary)', margin: '4px 0' }} />

      <button
        onClick={() => onAction('ask')}
        style={buttonStyle}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span style={{ fontSize: 14 }}>💬</span>
        <span>Ask</span>
      </button>

      {/* Close button (optional, but good for accessibility) */}
      <button
        onClick={onClose}
        style={{ ...buttonStyle, padding: '0 8px', color: 'var(--text-tertiary)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
      >
        ×
      </button>
    </div>
  )
}

const buttonStyle: React.CSSProperties = {
  background: 'transparent',
  border:     'none',
  color:      'var(--text-secondary)',
  padding:    '6px 12px',
  borderRadius: 6,
  cursor:     'pointer',
  display:    'flex',
  alignItems: 'center',
  gap:        6,
  fontFamily: "'DM Sans', sans-serif",
  fontSize:   12,
  fontWeight: 500,
  transition: 'all 0.15s',
  whiteSpace: 'nowrap',
}
