import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import App from './App.tsx'
import { FeedbackProvider } from './contexts/FeedbackContext.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <HelmetProvider>
            <ErrorBoundary>
                <FeedbackProvider>
                    <App />
                </FeedbackProvider>
            </ErrorBoundary>
        </HelmetProvider>
    </StrictMode>,
)
