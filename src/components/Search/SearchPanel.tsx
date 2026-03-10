import React, {
  useState, useRef, useEffect, useMemo, useCallback,
} from 'react'
import type { Commit } from '../../types'
import { timeAgo, truncate, branchColor } from '../../lib/utils'

interface Props {
  commits:        Record<string, Commit>
  onSelectCommit: (commit: Commit) => void
  onClose:        () => void
}

// Highlight matching text
const Highlighted: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query.trim()) return <span>{text}</span>

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts   = text.split(new RegExp(`(${escaped})`, 'gi'))

  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            style={{
              background:   '#f0c040',
              color:        '#111',
              borderRadius: 2,
              padding:      '0 1px',
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  )
}

export const SearchPanel: React.FC<Props> = ({
  commits, onSelectCommit, onClose,
}) => {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close on backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return Object.values(commits)
      .filter(c =>
        (c.content.toLowerCase().includes(q) ||
         (c.summary ?? '').toLowerCase().includes(q)),
      )
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 12)
  }, [query, commits])

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position:   'fixed',
        inset:      0,
        zIndex:     2000,
        background: 'rgba(0,0,0,0.3)',
        animation:  'fade-in 0.1s ease',
      }}
    >
      <div
        className="no-pan"
        style={{
          position:       'fixed',
          top:            28,
          left:           '50%',
          transform:      'translateX(-50%)',
          width:          540,
          background:     'rgba(10,10,16,0.98)',
          border:         '1px solid rgba(255,255,255,0.13)',
          borderRadius:   16,
          boxShadow:      '0 32px 80px rgba(0,0,0,0.85)',
          backdropFilter: 'blur(24px)',
          animation:      'search-in 0.18s cubic-bezier(0.34,1.56,0.64,1)',
          overflow:       'hidden',
        }}
      >
        {/* Input row */}
        <div style={{
          padding:      '14px 18px',
          display:      'flex',
          alignItems:   'center',
          gap:          12,
          borderBottom: results.length > 0
            ? '1px solid rgba(255,255,255,0.07)'
            : 'none',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 17, lineHeight: 1 }}>
            ⌕
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && onClose()}
            placeholder="Search across all threads…"
            style={{
              flex:       1,
              background: 'none',
              border:     'none',
              color:      '#fff',
              fontFamily: "'DM Sans', sans-serif",
              fontSize:   15,
              outline:    'none',
            }}
          />
          <kbd
            onClick={onClose}
            style={{
              fontFamily:   'monospace',
              fontSize:     11,
              color:        'rgba(255,255,255,0.28)',
              border:       '1px solid rgba(255,255,255,0.15)',
              borderRadius: 5,
              padding:      '2px 7px',
              cursor:       'pointer',
            }}
          >
            esc
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div style={{ maxHeight: 380, overflowY: 'auto', padding: '6px 0' }}>
            {results.map(c => {
              const bColor = branchColor(c.branchLabel)
              return (
                <div
                  key={c.id}
                  onClick={() => { onSelectCommit(c); onClose() }}
                  style={{
                    padding:    '10px 18px',
                    cursor:     'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent'
                  }}
                >
                  <div style={{
                    display:     'flex',
                    alignItems:  'center',
                    gap:         8,
                    marginBottom: 4,
                  }}>
                    <div style={{
                      width:        6,
                      height:       6,
                      borderRadius: '50%',
                      background:   c.role === 'user' ? '#60a5fa' : '#4ade80',
                      flexShrink:   0,
                    }} />
                    <span style={{
                      fontFamily:    "'Syne', sans-serif",
                      fontSize:      10,
                      color:         'rgba(255,255,255,0.32)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}>
                      {c.role} · {timeAgo(c.timestamp)}
                    </span>
                    {c.branchLabel && (
                      <span style={{
                        marginLeft: 'auto',
                        fontFamily: "'DM Mono', monospace",
                        fontSize:   10,
                        color:      bColor,
                      }}>
                        {c.branchLabel}
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize:   13,
                    color:      '#ccc',
                    lineHeight: 1.5,
                  }}>
                    <Highlighted text={truncate(c.content, 130)} query={query} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* No results */}
        {query.trim() && results.length === 0 && (
          <div style={{
            padding:    '28px 18px',
            textAlign:  'center',
            color:      'rgba(255,255,255,0.2)',
            fontFamily: "'DM Mono', monospace",
            fontSize:   12,
          }}>
            no results for "{query}"
          </div>
        )}

        {/* Hint when empty */}
        {!query.trim() && (
          <div style={{
            padding:    '20px 18px',
            color:      'rgba(255,255,255,0.18)',
            fontFamily: "'DM Mono', monospace",
            fontSize:   11,
            lineHeight: 2,
          }}>
            <div>search message content and summaries</div>
            <div style={{ color: 'rgba(255,255,255,0.1)' }}>⌘K to open · esc to close</div>
          </div>
        )}
      </div>
    </div>
  )
}
