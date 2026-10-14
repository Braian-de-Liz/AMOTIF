import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { InviteLinksPanel } from '@/components/InviteLinksPanel'

const BASE = 'http://localhost:3333/api'
const link = (o = {}) => ({
  id: 'l1', token: 'tok123', cargo: 'GUITARRISTA', max_usos: 10, usos: 2,
  expira_em: '2030-01-01T00:00:00.000Z', ...o,
})
const listHandler = (links: unknown[]) =>
  http.get(`${BASE}/colaboration/p1/invite-links`, () => HttpResponse.json({ links }))

// userEvent.setup() instala um clipboard fake; criamos o spy depois dele.
function setupUser() {
  const user = userEvent.setup()
  const writeText = vi.spyOn(navigator.clipboard, 'writeText')
  return { user, writeText }
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => { server.resetHandlers(); vi.restoreAllMocks() })
afterAll(() => server.close())

describe('InviteLinksPanel', () => {
  it('lista os links existentes', async () => {
    server.use(listHandler([link(), link({ id: 'l2', cargo: 'BAIXISTA', usos: 0 })]))
    render(<InviteLinksPanel projetoId="p1" />)
    expect(await screen.findByText('GUITARRISTA')).toBeInTheDocument()
    expect(screen.getByText('BAIXISTA')).toBeInTheDocument()
    expect(screen.getByText(/2\/10 usos/)).toBeInTheDocument()
  })

  it('cria um link e recarrega a lista', async () => {
    let created = false
    let body: unknown
    server.use(
      http.get(`${BASE}/colaboration/p1/invite-links`, () =>
        HttpResponse.json({ links: created ? [link()] : [] })),
      http.post(`${BASE}/colaboration/p1/invite-link`, async ({ request }) => {
        body = await request.json()
        created = true
        return HttpResponse.json({ ok: true })
      }),
    )
    render(<InviteLinksPanel projetoId="p1" />)
    await userEvent.click(screen.getByRole('button', { name: /Gerar link/ }))
    expect(await screen.findByText('GUITARRISTA')).toBeInTheDocument()
    expect(body).toEqual({})
  })

  it('mostra erro da API ao criar', async () => {
    server.use(
      listHandler([]),
      http.post(`${BASE}/colaboration/p1/invite-link`, () =>
        HttpResponse.json({ mensagem: 'Limite de links atingido' }, { status: 400 })),
    )
    render(<InviteLinksPanel projetoId="p1" />)
    await userEvent.click(screen.getByRole('button', { name: /Gerar link/ }))
    expect(await screen.findByText('Limite de links atingido')).toBeInTheDocument()
  })

  it('copia a URL do convite para a área de transferência', async () => {
    server.use(listHandler([link()]))
    const { user, writeText } = setupUser()
    render(<InviteLinksPanel projetoId="p1" />)
    await screen.findByText('GUITARRISTA')
    await user.click(screen.getByTitle('Copiar link'))
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/convite/tok123`)
  })

  it('mostra erro se a cópia falhar', async () => {
    server.use(listHandler([link()]))
    const { user, writeText } = setupUser()
    writeText.mockRejectedValue(new Error('negado'))
    render(<InviteLinksPanel projetoId="p1" />)
    await screen.findByText('GUITARRISTA')
    await user.click(screen.getByTitle('Copiar link'))
    expect(await screen.findByText('Não foi possível copiar o link.')).toBeInTheDocument()
  })

  it('revoga um link e o remove da lista', async () => {
    const del = vi.fn()
    server.use(
      listHandler([link()]),
      http.delete(`${BASE}/colaboration/p1/invite-link/l1`, () => { del(); return HttpResponse.json({ ok: true }) }),
    )
    render(<InviteLinksPanel projetoId="p1" />)
    await screen.findByText('GUITARRISTA')
    await userEvent.click(screen.getByTitle('Revogar link'))
    await waitFor(() => expect(screen.queryByText('GUITARRISTA')).not.toBeInTheDocument())
    expect(del).toHaveBeenCalledTimes(1)
  })

  it('mostra erro e mantém o link se a revogação falhar', async () => {
    server.use(
      listHandler([link()]),
      http.delete(`${BASE}/colaboration/p1/invite-link/l1`, () =>
        HttpResponse.json({ mensagem: 'Sem permissão' }, { status: 403 })),
    )
    render(<InviteLinksPanel projetoId="p1" />)
    await screen.findByText('GUITARRISTA')
    await userEvent.click(screen.getByTitle('Revogar link'))
    expect(await screen.findByText('Sem permissão')).toBeInTheDocument()
    expect(screen.getByText('GUITARRISTA')).toBeInTheDocument()
  })
})
