import React, { useState, useEffect, useRef } from 'react'
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
  onClick: (e: React.MouseEvent) => void
  title?: string
  style?: React.CSSProperties
}> = ({ label, onClick, title, style }) => (
  <button
    title={title}
    onClick={onClick}
    className="no-pan"
    style={{ ...BTN, width: 36, height: 36, fontSize: 16, ...style }}
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
  const { 
    sessions, currentSessionId, 
    createSession, switchSession, deleteSession 
  } = useConversationStore()
  
  const [showSessions, setShowSessions] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const currentSession = sessions[currentSessionId]
  const sessionList = Object.values(sessions).sort((a, b) => b.lastModified - a.lastModified)

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowSessions(false)
      }
    }
    document.addEventListener('mousedown', clickOutside)
    return () => document.removeEventListener('mousedown', clickOutside)
  }, [])

  const zoom = (action: string) => {
    window.dispatchEvent(new CustomEvent('graphchat:zoom', { detail: action }))
  }

  return (
    <>
      {/* ── Top-left: logo & session manager ── */}
      <div
        className="no-pan"
        style={{
          position:       'fixed',
          top:            20,
          left:           20,
          display:        'flex',
          alignItems:     'center',
          gap:            8,
          zIndex:         500,
        }}
      >
        {/* Logo */}
        <div style={{
          ...BTN,
          padding:    '9px 16px',
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
        </div>

        {/* Session Switcher */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            onClick={() => setShowSessions(!showSessions)}
            style={{
              ...BTN,
              padding: '0 12px',
              height: 38,
              minWidth: 140,
              justifyContent: 'space-between',
              gap: 10,
              borderColor: showSessions ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)',
              color: showSessions ? '#fff' : 'rgba(255,255,255,0.55)',
            }}
          >
            <span style={{ 
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 
            }}>
              {currentSession?.name || 'Loading...'}
            </span>
            <span style={{ fontSize: 10, opacity: 0.5 }}>{showSessions ? '▲' : '▼'}</span>
          </button>

          {showSessions && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              width: 260,
              background: 'rgba(11,11,17,0.98)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              padding: '6px',
              backdropFilter: 'blur(20px)',
              maxHeight: 400,
              overflowY: 'auto',
            }}>
              {sessionList.map(s => (
                <div 
                  key={s.id}
                  onClick={() => { switchSession(s.id); setShowSessions(false) }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: s.id === currentSessionId ? 'rgba(99,102,241,0.15)' : 'transparent',
                    color: s.id === currentSessionId ? '#fff' : 'rgba(255,255,255,0.6)',
                    transition: 'all 0.1s',
                    marginBottom: 2,
                  }}
                  onMouseEnter={e => {
                    if (s.id !== currentSessionId) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  }}
                  onMouseLeave={e => {
                    if (s.id !== currentSessionId) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <span style={{ 
                    fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: 10 
                  }}>
                    {s.name}
                  </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (window.confirm('Delete this chat?')) {
                        deleteSession(s.id)
                        setShowSessions(false)
                      }
                    }}
                    style={{
                      background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)',
                      cursor: 'pointer', fontSize: 16, padding: '0 4px'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Chat */}
        <IconBtn 
          label="+" 
          title="New Chat" 
          onClick={() => { createSession(); setShowSessions(false) }} 
          style={{ height: 38, width: 38 }}
        />
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
