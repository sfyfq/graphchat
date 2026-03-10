import React, { useState, useEffect } from 'react'
import { useConversationStore } from '../../store/conversationStore'

interface Props {
  onSearchOpen: () => void
}

const BTN: React.CSSProperties = {
  background:     'rgba(10,10,16,0.9)',
  border:         '1px solid rgba(255,255,255,0.1)',
  borderRadius:   10,
  color:          'rgba(255,255,255,0.55)',
  cursor:         'pointer',
  fontFamily:     "'DM Sans', sans-serif",
  fontSize:       13,
  backdropFilter: 'blur(12px)',
  transition:     'all 0.15s',
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
}

const IconBtn: React.FC<{
  label: string
  onClick: () => void
  title?: string
}> = ({ label, onClick, title }) => (
  <button
    title={title}
    onClick={onClick}
    className="no-pan"
    style={{ ...BTN, width: 36, height: 36, fontSize: 16 }}
    onMouseEnter={e => {
      const el = e.currentTarget
      el.style.borderColor = 'rgba(99,102,241,0.5)'
      el.style.color = '#fff'
    }}
    onMouseLeave={e => {
      const el = e.currentTarget
      el.style.borderColor = 'rgba(255,255,255,0.1)'
      el.style.color = 'rgba(255,255,255,0.55)'
    }}
  >
    {label}
  </button>
)

export const Toolbar: React.FC<Props> = ({ onSearchOpen }) => {
  const { commits } = useConversationStore()
  const commitCount = Object.keys(commits).length

  const zoom = (action: string) => {
    window.dispatchEvent(new CustomEvent('graphchat:zoom', { detail: action }))
  }

  return (
    <>
      {/* ── Top-left: logo ── */}
      <div
        className="no-pan"
        style={{
          position:       'fixed',
          top:            20,
          left:           20,
          display:        'flex',
          alignItems:     'center',
          gap:            12,
          zIndex:         500,
        }}
      >
        <div style={{
          ...BTN,
          padding:    '9px 16px',
          gap:        10,
          cursor:     'default',
          height:     38,
        }}>
          <span style={{
            fontFamily:    "'Syne', sans-serif",
            fontWeight:    800,
            fontSize:      17,
            color:         '#fff',
            letterSpacing: '-0.03em',
          }}>
            graph<span style={{ color: '#6366f1' }}>chat</span>
          </span>

          <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />

          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize:   10,
            color:      'rgba(255,255,255,0.3)',
          }}>
            {commitCount} {commitCount === 1 ? 'commit' : 'commits'}
          </span>
        </div>
      </div>

      {/* ── Top-right: controls ── */}
      <div
        className="no-pan"
        style={{
          position: 'fixed',
          top:      20,
          right:    20,
          display:  'flex',
          gap:      8,
          zIndex:   500,
        }}
      >
        {/* Search */}
        <button
          onClick={onSearchOpen}
          className="no-pan"
          style={{
            ...BTN,
            padding: '9px 14px',
            gap:     8,
            height:  38,
          }}
          onMouseEnter={e => {
            const el = e.currentTarget
            el.style.borderColor = 'rgba(99,102,241,0.5)'
            el.style.color = '#fff'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget
            el.style.borderColor = 'rgba(255,255,255,0.1)'
            el.style.color = 'rgba(255,255,255,0.55)'
          }}
        >
          <span style={{ fontSize: 15 }}>⌕</span>
          <span>Search</span>
          <kbd style={{
            fontFamily:   'monospace',
            fontSize:     10,
            color:        'rgba(255,255,255,0.28)',
            border:       '1px solid rgba(255,255,255,0.15)',
            borderRadius: 4,
            padding:      '1px 6px',
          }}>
            ⌘K
          </kbd>
        </button>

        <IconBtn label="−" onClick={() => zoom('out')}  title="Zoom out" />
        <IconBtn label="+" onClick={() => zoom('in')}   title="Zoom in" />
        <IconBtn label="⊙" onClick={() => zoom('reset')} title="Reset view" />
      </div>

      {/* ── Bottom-left: legend ── */}
      <div
        className="no-pan"
        style={{
          position:       'fixed',
          bottom:         20,
          left:           20,
          background:     'rgba(10,10,16,0.88)',
          border:         '1px solid rgba(255,255,255,0.08)',
          borderRadius:   12,
          padding:        '12px 16px',
          zIndex:         500,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{
          fontFamily:    "'Syne', sans-serif",
          fontSize:      9,
          color:         'rgba(255,255,255,0.28)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom:  9,
        }}>
          Legend
        </div>

        {[
          ['U',  '#3b82f6', 'User message'],
          ['✦', '#10b981', 'Assistant reply'],
        ].map(([icon, color, label]) => (
          <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
            <div style={{
              width:          22,
              height:         22,
              borderRadius:   '50%',
              background:     `${color as string}1a`,
              border:         `1.5px solid ${color as string}`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       9,
              color:          'rgba(255,255,255,0.65)',
              fontFamily:     "'DM Mono', monospace",
            }}>
              {icon}
            </div>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize:   12,
              color:      'rgba(255,255,255,0.4)',
            }}>
              {label}
            </span>
          </div>
        ))}

        <div style={{
          borderTop:  '1px solid rgba(255,255,255,0.07)',
          marginTop:  6,
          paddingTop: 8,
          fontFamily: "'DM Mono', monospace",
          fontSize:   10,
          color:      'rgba(255,255,255,0.18)',
          lineHeight: 1.8,
        }}>
          scroll · zoom<br />
          drag · pan<br />
          click · open chat
        </div>
      </div>
    </>
  )
}
