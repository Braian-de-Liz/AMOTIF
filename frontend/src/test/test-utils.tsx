import type { ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { UserDataProvider } from '@/contexts/UserDataContext'

function AllProviders({ children }: { children: ReactNode }) {
  return (
    <HelmetProvider>
      <MemoryRouter>
        <UserDataProvider>{children}</UserDataProvider>
      </MemoryRouter>
    </HelmetProvider>
  )
}

function renderWithProviders(ui: ReactNode, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export { renderWithProviders }
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
