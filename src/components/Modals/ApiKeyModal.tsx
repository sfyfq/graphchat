import * as React from 'react'
import { useState } from 'react'
import { useConfigStore } from '../../store/configStore'

export const ApiKeyModal: React.FC = () => {
  const { showKeyModal, setShowKeyModal, setApiKey } = useConfigStore()
  const [inputValue, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!showKeyModal) return null

  const handleSave = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) {
      setError('Please enter an API key')
      return
    }
    // Basic Gemini key format check (usually starts with AIza)
    if (trimmed.length < 30) {
      setError('Invalid API key format')
      return
    }

    setApiKey(trimmed)
    setShowKeyModal(false)
    setError(null)
    setInput('')
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      animation: 'dialog-in 0.2s ease-out'
    }}>
      <div style={{
        width: 400,
        background: 'var(--bg-surface-solid)',
        border: '1px solid var(--border-primary)',
        borderRadius: 20,
        padding: '24px 28px',
        boxShadow: 'var(--shadow-main)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        <div>
          <h2 style={{ 
            margin: 0, 
            fontFamily: "'Syne', sans-serif", 
            fontSize: 20, 
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em'
          }}>Enter Gemini API Key</h2>
          <p style={{ 
            margin: '8px 0 0', 
            fontSize: 13, 
            color: 'var(--text-secondary)',
            lineHeight: 1.5
          }}>
            Your key is stored only in memory for this session and never leaves your browser.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input 
            type="password"
            autoFocus
            value={inputValue}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="AIza..."
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'var(--border-primary)'}`,
              borderRadius: 12,
              padding: '12px 16px',
              color: 'var(--text-primary)',
              fontSize: 14,
              fontFamily: "'DM Mono', monospace",
              outline: 'none',
              transition: 'all 0.2s'
            }}
          />
          {error && (
            <span style={{ fontSize: 11, color: '#fca5a5' }}>⚠ {error}</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button 
            onClick={() => setShowKeyModal(false)}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 12,
              background: 'var(--bg-input)',
              border: '1px solid var(--border-secondary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            style={{
              flex: 2,
              padding: '12px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
              transition: 'all 0.2s'
            }}
          >
            Save Key
          </button>
        </div>

        <a 
          href="https://aistudio.google.com/app/apikey" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: 'var(--text-primary)',
            opacity: 0.6,
            textDecoration: 'none',
            marginTop: 4
          }}
        >
          Get a free key from Google AI Studio →
        </a>
      </div>
    </div>
  )
}
