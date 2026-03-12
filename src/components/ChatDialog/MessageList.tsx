import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { useConversationStore } from '../../store/conversationStore'
import { getStorageScope } from '../../store/authStore'
import { getBlobUrl } from '../../lib/storage'
import type { Commit, Attachment } from '../../types'
import { timeAgo } from '../../lib/utils'
import { TextSelectionMenu } from './TextSelectionMenu'

import 'katex/dist/katex.min.css'

interface Props {
  messages:           Commit[]
  loading:            boolean
  streamingContent?:  string
  pendingUserContent?: string
  onSelectionAction?: (type: 'explain' | 'ask', text: string, messageId: string, y: number) => void
}

// ── Helper Component for Message Attachments ──
const AttachmentPreview: React.FC<{ id: string }> = ({ id }) => {
  const { library } = useConversationStore()
  const attachment = library[id]
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!attachment) return
    let active = true
    const scope = getStorageScope()
    getBlobUrl(scope, id).then(u => {
      if (active) setUrl(u)
    })
    return () => {
      active = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [id, attachment])

  if (!attachment) return null

  const isImage = attachment.type.startsWith('image/')
  const isAudio = attachment.type.startsWith('audio/')
  const isVideo = attachment.type.startsWith('video/')

  return (
    <div style={{ marginBottom: 10 }}>
      {isImage && url ? (
        <img 
          src={url} 
          style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 10, display: 'block', border: '1px solid rgba(255,255,255,0.1)' }} 
          alt={attachment.name} 
        />
      ) : isAudio && url ? (
        <audio controls src={url} style={{ width: '100%', height: 32 }} />
      ) : isVideo && url ? (
        <video controls src={url} style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 10 }} />
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
          background: 'rgba(255,255,255,0.05)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <span style={{ fontSize: 20 }}>📄</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 12, color: '#fff', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {attachment.name}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
              {(attachment.size / 1024).toFixed(1)} KB · {attachment.type.split('/')[1]?.toUpperCase()}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export const MarkdownComponents: any = {
  p: ({ children }: any) => <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{children}</p>,
  ul: ({ children }: any) => <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>{children}</ul>,
  ol: ({ children }: any) => <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>{children}</ol>,
  li: ({ children }: any) => <li style={{ marginBottom: '4px' }}>{children}</li>,
  code: ({ children, inline }: any) => (
    <code style={{
      background: 'rgba(255,255,255,0.1)',
      padding: inline ? '2px 4px' : '8px',
      borderRadius: 4,
      fontSize: '0.9em',
      fontFamily: "'DM Mono', monospace",
      display: inline ? 'inline' : 'block',
      overflowX: 'auto',
    }}>
      {children}
    </code>
  ),
}

export const MessageList: React.FC<Props> = ({ 
  messages, loading, streamingContent, pendingUserContent, onSelectionAction 
}) => {
  const endRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [selection, setSelection] = useState<{ 
    text: string, 
    x: number, 
    y: number, 
    isBelow: boolean,
    messageId: string 
  } | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, loading, streamingContent, pendingUserContent])

  const handleMouseUp = (messageId: string) => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) {
      setSelection(null)
      return
    }

    const text = sel.toString().trim()
    if (!text) {
      setSelection(null)
      return
    }

    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    // Determine if we should show the menu below the selection (if not enough space above)
    const spaceAbove = rect.top
    const isBelow = spaceAbove < 60 // 60px is roughly menu height + margin

    setSelection({
      text,
      x: rect.left + rect.width / 2,
      y: isBelow ? rect.bottom : rect.top,
      isBelow,
      messageId
    })
  }

  // Clear selection on document click if it's not the menu
  useEffect(() => {
    const handleDocClick = () => {
      // Small timeout to allow menu actions to fire before clearing
      setTimeout(() => {
        const sel = window.getSelection()
        if (!sel || sel.isCollapsed) {
          setSelection(null)
        }
      }, 100)
    }
    document.addEventListener('mousedown', handleDocClick)
    return () => document.removeEventListener('mousedown', handleDocClick)
  }, [])

  if (messages.length === 0 && !loading && !streamingContent && !pendingUserContent) {
    return (
      <div style={{
        textAlign:  'center',
        color:      'rgba(255,255,255,0.2)',
        fontFamily: "'DM Mono', monospace",
        fontSize:   12,
        paddingTop: 48,
        lineHeight: 1.8,
      }}>
        no messages yet<br />start the thread ↓
      </div>
    )
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {selection && createPortal(
        <TextSelectionMenu 
          x={selection.x} 
          y={selection.y} 
          isBelow={selection.isBelow}
          onAction={(type) => {
            const range = window.getSelection()?.getRangeAt(0)
            const rect = range?.getBoundingClientRect()
            let relY = 0
            if (containerRef.current && rect) {
              const cRect = containerRef.current.getBoundingClientRect()
              relY = rect.top - cRect.top + containerRef.current.scrollTop
            }
            onSelectionAction?.(type, selection.text, selection.messageId, relY)
            setSelection(null)
            window.getSelection()?.removeAllRanges()
          }}
          onClose={() => setSelection(null)}
        />,
        document.body
      )}
      {messages.map((m) => (
        <div
          key={m.id}
          style={{
            display:        'flex',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom:   10,
            animation:      'msg-in 0.15s ease',
          }}
        >
          <div 
            onMouseUp={() => m.role === 'assistant' && handleMouseUp(m.id)}
            style={{
              maxWidth:     '82%',
              padding:      '10px 14px',
              borderRadius: m.role === 'user'
                ? '14px 14px 4px 14px'
                : '14px 14px 14px 4px',
              background: m.role === 'user'
                ? 'linear-gradient(135deg, #2563eb, #4f46e5)'
                : 'rgba(255,255,255,0.06)',
              border:     m.role === 'assistant'
                ? '1px solid rgba(255,255,255,0.09)'
                : 'none',
              color:      '#ececec',
              fontFamily: "'DM Sans', sans-serif",
              fontSize:   13.5,
              lineHeight: 1.65,
            }}
          >
            {/* Attachments */}
            {m.attachmentIds && m.attachmentIds.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                {m.attachmentIds.map(id => <AttachmentPreview key={id} id={id} />)}
              </div>
            )}

            <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkMath]} 
              rehypePlugins={[rehypeKatex]}
              components={MarkdownComponents}
            >
              {m.content}
            </ReactMarkdown>
            <div style={{
              fontSize:   10,
              color:      'rgba(255,255,255,0.3)',
              marginTop:  5,
              textAlign:  'right',
              fontFamily: "'DM Mono', monospace",
            }}>
              {timeAgo(m.timestamp)}
            </div>
          </div>
        </div>
      ))}

      {/* Pending (uncommitted) user message */}
      {pendingUserContent && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
          <div style={{
            maxWidth:     '82%',
            padding:      '10px 14px',
            borderRadius: '14px 14px 4px 14px',
            background:   'linear-gradient(135deg, #2563eb, #4f46e5)',
            color:        '#ececec',
            fontFamily:   "'DM Sans', sans-serif",
            fontSize:     13.5,
            lineHeight:   1.65,
            opacity:      0.7, // Visual indicator that it's pending
          }}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkMath]} 
              rehypePlugins={[rehypeKatex]}
              components={MarkdownComponents}
            >
              {pendingUserContent}
            </ReactMarkdown>
            <div style={{
              fontSize:   10,
              color:      'rgba(255,255,255,0.3)',
              marginTop:  5,
              textAlign:  'right',
              fontFamily: "'DM Mono', monospace",
            }}>
              sending...
            </div>
          </div>
        </div>
      )}

      {/* Streaming assistant message */}
      {streamingContent && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
          <div style={{
            maxWidth:     '82%',
            padding:      '10px 14px',
            borderRadius: '14px 14px 14px 4px',
            background:   'rgba(255,255,255,0.06)',
            border:       '1px solid rgba(255,255,255,0.09)',
            color:        '#ececec',
            fontFamily:   "'DM Sans', sans-serif",
            fontSize:     13.5,
            lineHeight:   1.65,
          }}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkMath]} 
              rehypePlugins={[rehypeKatex]}
              components={MarkdownComponents}
            >
              {streamingContent}
            </ReactMarkdown>
            <span style={{
              display:    'inline-block',
              width:      8,
              height:     14,
              background: '#6366f1',
              marginLeft: 4,
              animation:  'dot-pulse 0.8s infinite',
              verticalAlign: 'middle',
            }} />
          </div>
        </div>
      )}

      {loading && !streamingContent && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
          <div style={{
            padding:      '12px 16px',
            borderRadius: '14px 14px 14px 4px',
            background:   'rgba(255,255,255,0.06)',
            border:       '1px solid rgba(255,255,255,0.09)',
          }}>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  style={{
                    width:        6,
                    height:       6,
                    borderRadius: '50%',
                    background:   'rgba(255,255,255,0.45)',
                    animation:    `dot-pulse 1.2s ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  )
}
