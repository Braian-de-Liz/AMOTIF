import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { ErrorBoundary } from './components/ErrorBoundary'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <HelmetProvider>
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        </HelmetProvider>
    </StrictMode>,
)
