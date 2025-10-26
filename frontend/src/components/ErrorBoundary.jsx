// components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // In production, you could send this to an error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    // Navigate to home
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          color: '#fff',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '600px',
            padding: '40px',
            backgroundColor: '#1a1a1a',
            borderRadius: '10px',
            border: '1px solid #333'
          }}>
            <h1 style={{
              fontSize: '2.5rem',
              marginBottom: '20px',
              color: '#ff4444'
            }}>
              ⚠️ Qualcosa è andato storto
            </h1>

            <p style={{
              fontSize: '1.2rem',
              marginBottom: '30px',
              color: '#ccc'
            }}>
              La Moral Torture Machine ha incontrato un errore imprevisto.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                marginBottom: '20px',
                textAlign: 'left',
                backgroundColor: '#0f0f0f',
                padding: '15px',
                borderRadius: '5px',
                border: '1px solid #ff4444'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  marginBottom: '10px',
                  color: '#ff4444',
                  fontWeight: 'bold'
                }}>
                  Dettagli Errore (Solo in Development)
                </summary>
                <pre style={{
                  fontSize: '0.9rem',
                  overflow: 'auto',
                  color: '#ff9999'
                }}>
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReset}
              style={{
                padding: '15px 40px',
                fontSize: '1.1rem',
                backgroundColor: '#ff4444',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#ff6666'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#ff4444'}
            >
              🏠 Torna alla Home
            </button>

            <p style={{
              marginTop: '30px',
              fontSize: '0.9rem',
              color: '#666'
            }}>
              Se il problema persiste, prova a ricaricare la pagina o contattare il supporto.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
