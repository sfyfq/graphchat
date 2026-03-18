import * as React from 'react'
import { useState, useEffect, useRef, useMemo } from 'react'
import { GoogleLogin, googleLogout, useGoogleOneTapLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import { useConversationStore } from '../../store/conversationStore'
import { useAuthStore } from '../../store/authStore'
import { useConfigStore } from '../../store/configStore'
import { estimateTokens, estimateAttachmentTokens, timeAgo } from '../../lib/utils'
import { GoogleProfile } from '../../types'

interface Props {
  onSearchOpen: () => void
  onLibraryToggle: () => void
}

const WORKER_URL = import.meta.env.VITE_WORKER_URL || ''

const BTN_BASE: React.CSSProperties = {
  background:     'var(--bg-surface)',
  border:         '1px solid var(--border-primary)',
  borderRadius:   10,
  color:          'var(--text-secondary)',
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
    style={{ ...BTN_BASE, width: 36, height: 36, fontSize: 16, ...style }}
    onMouseEnter={e => {
      const el = e.currentTarget
      el.style.borderColor = 'rgba(99,102,241,0.5)'
      el.style.color = 'var(--text-primary)'
    }}
    onMouseLeave={e => {
      const el = e.currentTarget
      el.style.borderColor = 'var(--border-primary)'
      el.style.color = 'var(--text-secondary)'
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

  const { user, idToken, isWhitelisted, login, logout, setWhitelisted, setShowStatusModal } = useAuthStore()
  const { apiKey, theme, setTheme } = useConfigStore()
  
  const [showSessions, setShowSessions] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  
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

  const handleLogout = () => {
    googleLogout()
    logout()
    setShowProfile(false)
  }

  // Whitelist Handshake
  const validateToken = async (token: string) => {
    setIsValidating(true)
    try {
      const decoded = jwtDecode<GoogleProfile>(token)
      login(decoded, token)

      const res = await fetch(`${WORKER_URL}/validate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const ok = res.ok
      setWhitelisted(ok)
      // Only show status modal if it was a fresh login or validation state changed
      if (!isWhitelisted && ok) setShowStatusModal(true)
    } catch (e) {
      console.error("Auth validation failed", e)
      setWhitelisted(false)
      // If validation fails critically (e.g. token malformed), log out
      if (e instanceof Error && e.message.includes('Invalid token')) {
        handleLogout()
      }
    } finally {
      setIsValidating(false)
    }
  }

  // Automatic "One Tap" login for returning users (Silent Refresh on reload)
  useGoogleOneTapLogin({
    onSuccess: credentialResponse => {
      if (credentialResponse.credential) {
        validateToken(credentialResponse.credential)
      }
    },
    onError: () => console.log('One Tap Login Failed'),
    disabled: !!user, // Disable if already logged in
    auto_select: true, // Crucial for silent refresh feel
  })

  // Re-validate on mount if we have a token
  useEffect(() => {
    if (idToken) {
      try {
        const decoded = jwtDecode<{ exp: number }>(idToken)
        const isExpired = decoded.exp * 1000 < Date.now()
        // If expired OR close to expiring (within 5 mins), treat as expired to trigger One Tap/Login
        const isCloseToExpiry = decoded.exp * 1000 < Date.now() + 5 * 60 * 1000

        if (isExpired || isCloseToExpiry) {
          console.log("Token expired or close to expiry, logging out to trigger refresh")
          handleLogout()
        } else if (!isWhitelisted) {
          validateToken(idToken)
        }
      } catch (e) {
        handleLogout()
      }
    }
  }, [])

  const zoom = (action: string) => {
    window.dispatchEvent(new CustomEvent('graphchat:zoom', { detail: action }))
  }

  const toggleTheme = () => {
    if (theme === 'system') setTheme('light')
    else if (theme === 'light') setTheme('dark')
    else setTheme('system')
  }

  const getThemeIcon = () => {
    if (theme === 'system') return '🌓'
    if (theme === 'light') return '☀️'
    return '🌙'
  }

  const getStatusText = () => {
    if (apiKey) return 'Local Key Active'
    if (isValidating) return 'Validating Access...'
    if (isWhitelisted) return 'Friend Mode Active'
    return 'Guest Mode (Mock AI)'
  }

  const getStatusColor = () => {
    if (apiKey) return '#60a5fa' // blue
    if (isValidating) return '#fbbf24' // amber/yellow
    if (isWhitelisted) return '#4ade80' // green
    return '#f87171' // red
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
          ...BTN_BASE,
          padding:    '9px 16px',
          cursor:     'default',
          height:     38,
        }}>
          <span style={{
            fontFamily:    "'Syne', sans-serif",
            fontWeight:    800,
            fontSize:      17,
            color:         'var(--text-primary)',
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
              ...BTN_BASE,
              padding: '0 12px',
              height: 38,
              minWidth: 140,
              justifyContent: 'space-between',
              gap: 10,
              borderColor: showSessions ? 'rgba(99,102,241,0.5)' : 'var(--border-primary)',
              color: showSessions ? 'var(--text-primary)' : 'var(--text-secondary)',
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
              background: 'var(--bg-surface-solid)',
              border: '1px solid var(--border-primary)',
              borderRadius: 12,
              boxShadow: 'var(--shadow-main)',
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
                    color: s.id === currentSessionId ? 'var(--text-primary)' : 'var(--text-secondary)',
                    transition: 'all 0.1s',
                    marginBottom: 2,
                  }}
                  onMouseEnter={e => {
                    if (s.id !== currentSessionId) e.currentTarget.style.background = 'var(--bg-input)'
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
                      background: 'none', border: 'none', color: 'var(--text-tertiary)',
                      cursor: 'pointer', fontSize: 16, padding: '0 4px'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
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
                  ...BTN_BASE,
                  width: 38,
                  height: 38,
                  padding: 0,
                  overflow: 'hidden',
                  border: (isWhitelisted || apiKey) ? '2px solid #6366f1' : '1px solid var(--border-primary)'
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
                  background: 'var(--bg-surface-solid)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 12,
                  padding: '12px',
                  backdropFilter: 'blur(20px)',
                  boxShadow: 'var(--shadow-main)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>{user.email}</div>
                  
                  <div style={{ 
                    fontSize: 10, 
                    color: getStatusColor(),
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <div style={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%', 
                      background: getStatusColor(),
                      animation: isValidating ? 'dot-pulse 1s infinite' : 'none'
                    }} />
                    {getStatusText()}
                  </div>

                  <button 
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: 'var(--bg-input)',
                      border: 'none',
                      borderRadius: 6,
                      color: 'var(--text-secondary)',
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
                  if (credentialResponse.credential) {
                    validateToken(credentialResponse.credential)
                  }
                }}
                onError={() => console.log('Login Failed')}
                theme="filled_black"
                shape="pill"
              />
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--border-secondary)', margin: '0 4px' }} />

        {/* Theme Switcher */}
        <IconBtn 
          label={<span style={{ fontSize: 14 }}>{getThemeIcon()}</span>} 
          onClick={toggleTheme} 
          title={`Theme: ${theme}`} 
        />

        {/* Search */}
        <button
          onClick={onSearchOpen}
          className="no-pan"
          style={{
            ...BTN_BASE,
            padding: '9px 14px',
            gap:     8,
            height:  38,
          }}
          onMouseEnter={e => {
            const el = e.currentTarget
            el.style.borderColor = 'rgba(99,102,241,0.5)'
            el.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget
            el.style.borderColor = 'var(--border-primary)'
            el.style.color = 'var(--text-secondary)'
          }}
        >
          <span style={{ fontSize: 15 }}>⌕</span>
          <span>Search</span>
          <kbd style={{
            fontFamily:   'monospace',
            fontSize:     10,
            color:        'var(--text-tertiary)',
            border:       '1px solid var(--border-secondary)',
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
        
        <div style={{ width: 1, background: 'var(--border-secondary)', margin: '4px 2px' }} />

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
          background:     'var(--bg-surface)',
          border:         '1px solid var(--border-secondary)',
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
          color:         'var(--text-tertiary)',
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
                color: 'var(--text-tertiary)', 
                fontFamily: "'DM Sans', sans-serif" 
              }}>{s.label}</span>
              <span style={{ 
                fontSize: 12, 
                color: 'var(--text-secondary)', 
                fontFamily: "'DM Mono', monospace" 
              }}>{s.value}</span>
            </div>
          ))}
          
          <div style={{ 
            marginTop: 4, 
            paddingTop: 8, 
            borderTop: '1px solid var(--border-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Updated</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {currentSession ? timeAgo(currentSession.lastModified) : '--'}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
