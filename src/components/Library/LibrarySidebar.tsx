import * as React from 'react'
import { useState, useEffect, useMemo } from 'react'
import { useConversationStore, useCurrentSession } from '../../store/conversationStore'
import { getStorageScope } from '../../store/authStore'
import { getBlobUrl } from '../../lib/storage'
import { Attachment } from '../../types'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const SIDEBAR_STYLE: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  right: 0,
  width: 320,
  height: '100vh',
  background: 'rgba(11,11,17,0.98)',
  borderLeft: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(24px)',
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '-10px 0 50px rgba(0,0,0,0.5)',
}

const SECTION_HEADER: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  color: 'rgba(255,255,255,0.3)',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  padding: '24px 20px 12px',
}

const Thumbnail: React.FC<{ attachment: Attachment }> = ({ attachment }) => {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const scope = getStorageScope()
    getBlobUrl(scope, attachment.id).then(u => {
      if (active) setUrl(u)
    })
    return () => {
      active = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [attachment.id])

  if (attachment.type.startsWith('image/') && url) {
    return <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} alt={attachment.name} />
  }

  const icon = attachment.type.startsWith('audio/') ? '🎵' : attachment.type.startsWith('video/') ? '🎬' : '📄'
  return (
    <div style={{ 
      width: '100%', height: '100%', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', fontSize: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 6 
    }}>
      {icon}
    </div>
  )
}

export const LibrarySidebar: React.FC<Props> = ({ isOpen, onClose }) => {
  const { library, uploadAttachment } = useConversationStore()
  const currentSession = useCurrentSession()
  const [isUploading, setIsUploading] = useState(false)

  const sessionAttachmentIds = useMemo(() => {
    if (!currentSession) return new Set<string>()
    const ids = new Set<string>()
    Object.values(currentSession.commits).forEach(c => {
      c.attachmentIds?.forEach(id => ids.add(id))
    })
    return ids
  }, [currentSession])

  const sessionAttachments = useMemo(() => 
    Object.values(library).filter(a => sessionAttachmentIds.has(a.id)),
    [library, sessionAttachmentIds]
  )

  const globalAttachments = useMemo(() => 
    Object.values(library).filter(a => !sessionAttachmentIds.has(a.id)),
    [library, sessionAttachmentIds]
  )

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      await uploadAttachment(file)
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div style={{ 
      ...SIDEBAR_STYLE, 
      transform: isOpen ? 'translateX(0)' : 'translateX(100%)' 
    }}>
      {/* Header */}
      <div style={{ 
        padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <h2 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontSize: 18, color: '#fff' }}>Library</h2>
        <button 
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 24 }}
        >
          ×
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 40 }}>
        {/* Upload Area */}
        <div style={{ padding: '20px' }}>
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: 80, border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 12,
            cursor: isUploading ? 'default' : 'pointer', background: 'rgba(255,255,255,0.02)',
            transition: 'all 0.2s'
          }}>
            <span style={{ fontSize: 20, marginBottom: 4 }}>{isUploading ? '⌛' : '📤'}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isUploading ? 'Uploading...' : 'Upload File'}
            </span>
            <input type="file" onChange={handleUpload} style={{ display: 'none' }} disabled={isUploading} />
          </label>
        </div>

        {/* This Session */}
        <div style={SECTION_HEADER}>This Session</div>
        <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {sessionAttachments.map(a => (
            <div key={a.id} title={a.name} style={{ position: 'relative', aspectRatio: '1/1' }}>
              <Thumbnail attachment={a} />
            </div>
          ))}
          {sessionAttachments.length === 0 && (
            <div style={{ gridColumn: '1/-1', padding: '10px 0', fontSize: 12, color: 'rgba(255,255,255,0.15)', fontStyle: 'italic' }}>
              No attachments in this session
            </div>
          )}
        </div>

        {/* Global Library */}
        <div style={SECTION_HEADER}>Global Library</div>
        <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {globalAttachments.map(a => (
            <div key={a.id} title={a.name} style={{ position: 'relative', aspectRatio: '1/1' }}>
              <Thumbnail attachment={a} />
            </div>
          ))}
          {globalAttachments.length === 0 && (
            <div style={{ gridColumn: '1/-1', padding: '10px 0', fontSize: 12, color: 'rgba(255,255,255,0.15)', fontStyle: 'italic' }}>
              Global library is empty
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
