import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import JoinInvite from '@/pages/joinInvite'

const BASE = 'http://localhost:3333/api'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function setup(token = 'abc') {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[`/convite/${token}`]}>
        <Routes>
          <Route path="/convite/:token" element={<JoinInvite />} />
          <Route path="/studio/:id" element={<div>STUDIO PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  )
}

const preview = {
  projeto: { id: 'proj-9', titulo: 'Meu Som', genero: 'ROCK' },
  cargo: 'BATERISTA', convidado_por: 'Ana', expira_em: '2030-01-01T00:00:00Z',
}

describe('JoinInvite', () => {
  it('mostra a prévia do convite', async () => {
    server.use(http.get(`${BASE}/invite-link/abc`, () => HttpResponse.json(preview)))
    setup()
    expect(await screen.findByRole('heading', { name: 'Meu Som' })).toBeInTheDocument()
    expect(screen.getByText(/Ana convidou você para este projeto como/)).toBeInTheDocument()
    expect(screen.getByText('BATERISTA')).toBeInTheDocument()
  })

  it('entra no projeto e navega para /studio/:id', async () => {
    server.use(
      http.get(`${BASE}/invite-link/abc`, () => HttpResponse.json(preview)),
      http.post(`${BASE}/invite-link/abc`, () => HttpResponse.json({ projetoId: 'proj-9' })),
    )
    setup()
    await userEvent.click(await screen.findByRole('button', { name: 'Entrar no projeto' }))
    expect(await screen.findByText('STUDIO PAGE')).toBeInTheDocument()
  })

  it.each([
    [404, 'Convite não encontrado'],
    [410, 'Convite expirado'],
  ])('status %i mostra "Convite indisponível" e a mensagem', async (status, mensagem) => {
    server.use(http.get(`${BASE}/invite-link/abc`, () => HttpResponse.json({ mensagem }, { status })))
    setup()
    expect(await screen.findByText('Convite indisponível')).toBeInTheDocument()
    expect(screen.getByText(mensagem)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Entrar no projeto' })).not.toBeInTheDocument()
  })

  it('mostra erro e reabilita o botão se entrar falhar', async () => {
    server.use(
      http.get(`${BASE}/invite-link/abc`, () => HttpResponse.json(preview)),
      http.post(`${BASE}/invite-link/abc`, () => HttpResponse.json({ mensagem: 'Convite esgotado' }, { status: 410 })),
    )
    setup()
    await userEvent.click(await screen.findByRole('button', { name: 'Entrar no projeto' }))
    expect(await screen.findByText('Convite esgotado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar no projeto' })).toBeEnabled()
  })
})
