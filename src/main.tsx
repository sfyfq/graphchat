import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

if (!clientId) {
  console.error("VITE_GOOGLE_CLIENT_ID is missing from environment variables.")
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {clientId ? (
      <GoogleOAuthProvider clientId={clientId}>
        <App />
      </GoogleOAuthProvider>
    ) : (
      <div style={{
        background: '#080810',
        color: '#fff',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div>
          <h1 style={{ color: '#f87171' }}>Configuration Error</h1>
          <p><code>VITE_GOOGLE_CLIENT_ID</code> is missing.</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            Please add it to your <code>.env.local</code> file and restart the dev server.
          </p>
        </div>
      </div>
    )}
  </StrictMode>,
)
