import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '50vh',
                    padding: '2rem',
                    textAlign: 'center',
                }}>
                    <h2 style={{ color: 'var(--verde-escuro)', marginBottom: '1rem' }}>
                        Algo deu errado
                    </h2>
                    <p style={{ color: 'var(--texto-secundario)', marginBottom: '1.5rem' }}>
                        Ocorreu um erro inesperado. Por favor, tente novamente.
                    </p>
                    <button
                        onClick={this.handleReset}
                        style={{
                            padding: '0.7rem 1.5rem',
                            backgroundColor: 'var(--verde-medio)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '30px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Tentar Novamente
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export { ErrorBoundary };
