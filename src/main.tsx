import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[NODO OS] Error de render:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', background: '#08070F', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: '16px', padding: '24px', fontFamily: 'monospace'
        }}>
          <div style={{ fontSize: '32px' }}>⚠️</div>
          <h1 style={{ fontSize: '18px', color: '#E040A0' }}>Error al cargar NODO OS</h1>
          <pre style={{
            background: '#12101A', border: '1px solid #1E1C2A',
            padding: '16px', borderRadius: '8px', maxWidth: '600px',
            overflow: 'auto', fontSize: '12px', color: '#E8E6EE'
          }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack?.split('\n').slice(0, 8).join('\n')}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(135deg, #E040A0, #C026A8, #8B22E8)',
              color: 'white', border: 'none', padding: '10px 24px',
              borderRadius: '8px', cursor: 'pointer', fontWeight: 600
            }}
          >
            Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const rootEl = document.getElementById('root')
createRoot(rootEl!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>,
)
