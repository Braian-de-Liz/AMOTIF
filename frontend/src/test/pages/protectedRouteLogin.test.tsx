import { describe, it, expect, vi, beforeAll, afterAll, afterEach, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useLocation, type InitialEntry } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Login from '@/pages/login'

const ctx = vi.hoisted(() => ({
  value: { usuario: null as unknown, loading: false, error: null as string | null, refetch: async () => {} },
}))
vi.mock('@/contexts/UserDataContext', () => ({ useUserData: () => ctx.value }))

const user = { id: 'u1', nome_completo: 'X' }

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
beforeEach(() => {
  ctx.value = { usuario: null, loading: false, error: null, refetch: async () => {} }
})

function Where() {
  const loc = useLocation()
  return <div data-testid="loc">{loc.pathname}|{JSON.stringify(loc.state)}</div>
}

function renderApp(entry: InitialEntry) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/" element={<><Where /><Login /></>} />
          <Route path="/home" element={<div>HOME PAGE</div>} />
          <Route path="/convite/:token" element={<ProtectedRoute><div>CONVITE PAGE</div></ProtectedRoute>} />
          <Route path="*" element={<div>OUTRO</div>} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  )
}

describe('ProtectedRoute', () => {
  it('mostra "Carregando..." enquanto carrega', () => {
    ctx.value.loading = true
    renderApp('/convite/abc')
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('sem sessão em /convite/:token redireciona para "/" com state.from', () => {
    renderApp('/convite/abc')
    expect(screen.getByTestId('loc').textContent).toBe('/|{"from":"/convite/abc"}')
    expect(screen.queryByText('CONVITE PAGE')).not.toBeInTheDocument()
  })

  it('com sessão renderiza o conteúdo', () => {
    ctx.value.usuario = user
    renderApp('/convite/abc')
    expect(screen.getByText('CONVITE PAGE')).toBeInTheDocument()
  })
})

describe('Login: destino após autenticação', () => {
  async function fillAndSubmit() {
    server.use(http.post('http://localhost:3333/api/usuario/login', () => HttpResponse.json({ ok: true })))
    await userEvent.type(screen.getByLabelText('E-mail'), 'a@b.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'Senha@123')
    await userEvent.click(screen.getByRole('button', { name: /Entrar/ }))
  }

  it('após o login completo, quem veio de /convite/:token volta para ele', async () => {
    ctx.value.refetch = async () => { ctx.value.usuario = user }
    renderApp('/convite/abc')
    await fillAndSubmit()
    expect(await screen.findByText('CONVITE PAGE')).toBeInTheDocument()
  })

  it('login sem state.from vai para /home', async () => {
    ctx.value.refetch = async () => { ctx.value.usuario = user }
    renderApp('/')
    await fillAndSubmit()
    expect(await screen.findByText('HOME PAGE')).toBeInTheDocument()
  })

  it('usuário já logado com state.from de convite é levado ao convite', () => {
    ctx.value.usuario = user
    renderApp({ pathname: '/', state: { from: '/convite/xyz' } })
    expect(screen.getByText('CONVITE PAGE')).toBeInTheDocument()
  })

  it.each(['/studio/1', '//evil.com', '/convite'])('destino %s cai em /home', from => {
    ctx.value.usuario = user
    renderApp({ pathname: '/', state: { from } })
    expect(screen.getByText('HOME PAGE')).toBeInTheDocument()
  })
})
