import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  language?: 'bn' | 'en';
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const lang = this.props.language || 'bn';
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-primary)',
          padding: '40px',
          textAlign: 'center'
        }}>
          <AlertTriangle size={48} color="var(--gov-red)" style={{ marginBottom: '20px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--gov-red)' }}>
            {lang === 'bn' ? 'কিছু ভুল হয়েছে' : 'Something went wrong'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '400px' }}>
            {lang === 'bn'
              ? 'অ্যাপ্লিকেশনে একটি সমস্যা দেখা দিয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
              : 'The application encountered an error. Please try again.'}
          </p>
          {this.state.error && (
            <pre style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              background: 'var(--bg-secondary)',
              padding: '12px',
              borderRadius: '6px',
              maxWidth: '500px',
              overflow: 'auto',
              marginBottom: '20px',
              textAlign: 'left'
            }}>
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'var(--gov-green)',
              color: 'white',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} />
            {lang === 'bn' ? 'আবার চেষ্টা করুন' : 'Try Again'}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
