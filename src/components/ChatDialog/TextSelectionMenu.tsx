import React from 'react'

interface Props {
  x: number
  y: number
  onAction: (type: 'explain' | 'ask') => void
  onClose: () => void
}

export const TextSelectionMenu: React.FC<Props> = ({ x, y, onAction, onClose }) => {
  return (
    <div
      style={{
        position:       'fixed',
        left:           x,
        top:            y,
        transform:      'translate(-50%, -100%) translateY(-10px)',
        background:     'rgba(15,15,25,0.95)',
        border:         '1px solid rgba(255,255,255,0.15)',
        borderRadius:   10,
        padding:        '4px',
        display:        'flex',
        gap:            4,
        zIndex:         2000,
        backdropFilter: 'blur(12px)',
        boxShadow:      '0 8px 32px rgba(0,0,0,0.6)',
        animation:      'tooltip-in 0.15s ease-out',
      }}
    >
      <button
        onClick={() => onAction('explain')}
        style={buttonStyle}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span style={{ fontSize: 14 }}>🔍</span>
        <span>Explain</span>
      </button>

      <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

      <button
        onClick={() => onAction('ask')}
        style={buttonStyle}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span style={{ fontSize: 14 }}>💬</span>
        <span>Ask</span>
      </button>

      {/* Close button (optional, but good for accessibility) */}
      <button
        onClick={onClose}
        style={{ ...buttonStyle, padding: '0 8px', color: 'rgba(255,255,255,0.3)' }}
        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
      >
        ×
      </button>
    </div>
  )
}

const buttonStyle: React.CSSProperties = {
  background: 'transparent',
  border:     'none',
  color:      '#ececec',
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
