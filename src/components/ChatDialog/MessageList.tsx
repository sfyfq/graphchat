import React, { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import type { Commit } from '../../types'
import { timeAgo } from '../../lib/utils'

import 'katex/dist/katex.min.css'

interface Props {
  messages:         Commit[]
  loading:          boolean
  streamingContent?: string
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

export const MessageList: React.FC<Props> = ({ messages, loading, streamingContent }) => {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, loading, streamingContent])

  if (messages.length === 0 && !loading && !streamingContent) {
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
    <>
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
          <div style={{
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
          }}>
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
    </>
  )
}
