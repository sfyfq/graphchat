import * as React from 'react'
import { useState, useEffect, useRef, useMemo } from 'react'
import { GoogleLogin, googleLogout } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import { useConversationStore } from '../../store/conversationStore'
import { useAuthStore } from '../../store/authStore'
import { estimateTokens, estimateAttachmentTokens, timeAgo } from '../../lib/utils'
import { GoogleProfile } from '../../types'

interface Props {
  onSearchOpen: () => void
  onLibraryToggle: () => void
}

const WORKER_URL = import.meta.env.VITE_WORKER_URL || ''

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
  label: string | React.ReactNode
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

export const Toolbar: React.FC<Props> = ({ onSearchOpen, onLibraryToggle }) => {
  const { 
    sessions, currentSessionId, library,
    createSession, switchSession, deleteSession 
  } = useConversationStore()

  const { user, idToken, isWhitelisted, login, logout, setWhitelisted } = useAuthStore()
  
  const [showSessions, setShowSessions] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const currentSession = sessions[currentSessionId]
  const sessionList = Object.values(sessions).sort((a, b) => b.lastModified - a.lastModified)

  const stats = useMemo(() => {
    if (!currentSession) return []
    const commits = Object.values(currentSession.commits)
    const turns = commits.filter(c => c.role === 'assistant').length
    
    const totalTokens = commits.reduce((acc, c) => {
      let tokens = estimateTokens(c.content)
      if (c.attachmentIds) {
        c.attachmentIds.forEach(id => {
          const att = library[id]
          if (att) {
            tokens += estimateAttachmentTokens(att.type, att.width, att.height, att.duration)
          }
        })
      }
      return acc + tokens
    }, 0)
    
    let depth = 0
    let currId: string | null = currentSession.HEAD
    while (currId && currentSession.commits[currId]) {
      depth++
      currId = currentSession.commits[currId].parentId
    }

    const sourceIds = new Set(currentSession.edges.map(e => e.source))
    const branches = commits.filter(c => !sourceIds.has(c.id)).length

    return [
      { label: 'Turns',    value: turns },
      { label: 'Tokens',   value: totalTokens.toLocaleString() },
      { label: 'Depth',    value: depth },
      { label: 'Branches', value: branches },
      { label: 'Nodes',    value: commits.length },
    ]
  }, [currentSession, library])

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowSessions(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', clickOutside)
    return () => document.removeEventListener('mousedown', clickOutside)
  }, [])

  // Whitelist Handshake
  const validateToken = async (token: string) => {
    try {
      const res = await fetch(`${WORKER_URL}/validate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setWhitelisted(res.ok)
    } catch (e) {
      console.error("Auth validation failed", e)
      setWhitelisted(false)
    }
  }

  // Re-validate on mount if we have a token
  useEffect(() => {
    if (idToken && !isWhitelisted) {
      validateToken(idToken)
    }
  }, [])

  const zoom = (action: string) => {
    window.dispatchEvent(new CustomEvent('graphchat:zoom', { detail: action }))
  }

  const handleLogout = () => {
    googleLogout()
    logout()
    setShowProfile(false)
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
          alignItems: 'center',
          gap:      8,
          zIndex:   500,
        }}
      >
        {/* Auth Entry */}
        <div ref={profileRef} style={{ display: 'flex', alignItems: 'center' }}>
          {user ? (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowProfile(!showProfile)}
                style={{
                  ...BTN,
                  width: 38,
                  height: 38,
                  padding: 0,
                  overflow: 'hidden',
                  border: isWhitelisted ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <img src={user.picture} style={{ width: '100%', height: '100%' }} alt={user.name} />
              </button>
              
              {showProfile && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: 200,
                  background: 'rgba(11,11,17,0.98)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  padding: '12px',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>{user.email}</div>
                  
                  <div style={{ 
                    fontSize: 10, 
                    color: isWhitelisted ? '#4ade80' : '#f87171',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: isWhitelisted ? '#4ade80' : '#f87171' }} />
                    {isWhitelisted ? 'Friend Mode Active' : 'Guest Mode (Mock AI)'}
                  </div>

                  <button 
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: 'rgba(255,255,255,0.05)',
                      border: 'none',
                      borderRadius: 6,
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ transform: 'scale(0.85)', transformOrigin: 'right' }}>
              <GoogleLogin
                onSuccess={credentialResponse => {
                  const decoded = jwtDecode<GoogleProfile>(credentialResponse.credential!)
                  login(decoded, credentialResponse.credential!)
                  validateToken(credentialResponse.credential!)
                }}
                onError={() => console.log('Login Failed')}
                theme="filled_black"
                shape="pill"
              />
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />

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

        <IconBtn 
          label={<span style={{ fontSize: 14 }}>📁</span>} 
          onClick={onLibraryToggle} 
          title="Shared Library" 
        />
        
        <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 2px' }} />

        <IconBtn label="−" onClick={() => zoom('out')}  title="Zoom out" />
        <IconBtn label="+" onClick={() => zoom('in')}   title="Zoom in" />
        <IconBtn label="⊙" onClick={() => zoom('reset')} title="Reset view" />
      </div>

      {/* ── Bottom-left: Session Stats ── */}
      <div
        className="no-pan"
        style={{
          position:       'fixed',
          bottom:         20,
          left:           20,
          background:     'rgba(10,10,16,0.88)',
          border:         '1px solid rgba(255,255,255,0.08)',
          borderRadius:   12,
          padding:        '14px 18px',
          zIndex:         500,
          backdropFilter: 'blur(12px)',
          minWidth:       170,
        }}
      >
        <div style={{
          fontFamily:    "'Syne', sans-serif",
          fontSize:      10,
          fontWeight:    700,
          color:         'rgba(255,255,255,0.3)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom:  12,
          display:       'flex',
          alignItems:    'center',
          justifyContent: 'space-between'
        }}>
          <span>Session Stats</span>
          <div style={{ display: 'flex', gap: 4 }}>
             <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} title="User message" />
             <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} title="Assistant reply" />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {stats.map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ 
                fontSize: 12, 
                color: 'rgba(255,255,255,0.25)', 
                fontFamily: "'DM Sans', sans-serif" 
              }}>{s.label}</span>
              <span style={{ 
                fontSize: 12, 
                color: 'rgba(255,255,255,0.65)', 
                fontFamily: "'DM Mono', monospace" 
              }}>{s.value}</span>
            </div>
          ))}
          
          <div style={{ 
            marginTop: 4, 
            paddingTop: 8, 
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>Updated</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              {currentSession ? timeAgo(currentSession.lastModified) : '--'}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
