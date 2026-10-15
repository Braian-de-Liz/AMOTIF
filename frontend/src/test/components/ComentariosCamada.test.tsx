import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { ComentariosCamada, formatarTempo } from '@/components/ComentariosCamada'
import { useComentarios, type Comentario } from '@/hooks/useComentarios'

const BASE = 'http://localhost:3333/api'
const EU = 'u-eu'

const comentario = (o: Partial<Comentario> = {}): Comentario => ({
  id: 'c1', camadaId: 'l1', segundos: 75, texto: 'baixo atravessa aqui', versaoNumero: 1, resolvido: false,
  createdAt: '2026-10-15T10:00:00.000Z', updatedAt: '2026-10-15T10:00:00.000Z',
  autor: { id: 'u-outro', nome_completo: 'Maria Flauta', avatar_url: null }, ...o,
})

// Monta o painel ligado ao hook real, como o WaveformTrack faz.
function Painel({ currentTime = 12, onSeek = vi.fn(), papel = 'DONO' as string }) {
  const { comentarios, erro, criar, alternarResolvido, remover } = useComentarios('l1', true)
  return (
    <ComentariosCamada
      comentarios={comentarios}
      erro={erro}
      currentTime={currentTime}
      versaoAtual={2}
      podeComentar
      podeResolver={c => c.autor.id === EU || papel === 'DONO'}
      podeRemover={c => c.autor.id === EU || papel === 'DONO'}
      onSeek={onSeek}
      onCriar={criar}
      onAlternarResolvido={alternarResolvido}
      onRemover={remover}
    />
  )
}

const listar = (comentarios: Comentario[]) =>
  http.get(`${BASE}/layer/l1/comentarios`, () => HttpResponse.json({ comentarios }))

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => { server.resetHandlers(); vi.restoreAllMocks() })
afterAll(() => server.close())

describe('formatarTempo', () => {
  it('formata minutos e segundos', () => {
    expect(formatarTempo(0)).toBe('0:00')
    expect(formatarTempo(75.9)).toBe('1:15')
    expect(formatarTempo(-3)).toBe('0:00')
  })
})

describe('ComentariosCamada', () => {
  it('lista comentários com o instante e avisa quando foram feitos em outra versão', async () => {
    server.use(listar([comentario()]))
    render(<Painel />)
    expect(await screen.findByText('baixo atravessa aqui')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1:15' })).toBeInTheDocument()
    expect(screen.getByText('na v1')).toBeInTheDocument()
  })

  it('clicar no instante leva o player até ele', async () => {
    server.use(listar([comentario()]))
    const onSeek = vi.fn()
    render(<Painel onSeek={onSeek} />)
    await userEvent.click(await screen.findByRole('button', { name: '1:15' }))
    expect(onSeek).toHaveBeenCalledWith(75)
  })

  it('comenta no instante em que começou a escrever', async () => {
    let body: unknown
    server.use(
      listar([]),
      http.post(`${BASE}/layer/l1/comentarios`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ comentario: comentario({ id: 'c2', segundos: 12, texto: 'entra atrasado', autor: { id: EU, nome_completo: 'Eu', avatar_url: null } }) }, { status: 201 })
      }),
    )
    render(<Painel currentTime={12} />)
    expect(await screen.findByText(/Nenhum comentário/)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Texto do comentário'), 'entra atrasado')
    expect(screen.getByText('0:12')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Comentar' }))
    expect(await screen.findByText('entra atrasado')).toBeInTheDocument()
    expect(body).toEqual({ segundos: 12, texto: 'entra atrasado' })
    expect(screen.getByLabelText('Texto do comentário')).toHaveValue('')
  })

  it('resolver esconde o comentário até marcar "Mostrar resolvidos"', async () => {
    server.use(
      listar([comentario()]),
      http.patch(`${BASE}/comentarios/c1`, () => HttpResponse.json({ comentario: comentario({ resolvido: true }) })),
    )
    render(<Painel />)
    await userEvent.click(await screen.findByRole('button', { name: 'Marcar como resolvido' }))
    await waitFor(() => expect(screen.queryByText('baixo atravessa aqui')).not.toBeInTheDocument())
    await userEvent.click(screen.getByLabelText(/Mostrar resolvidos \(1\)/))
    const item = screen.getByText('baixo atravessa aqui').closest('li')!
    expect(within(item).getByText('Resolvido')).toBeInTheDocument()
  })

  it('apagar chama DELETE sem Content-Type JSON e remove da lista', async () => {
    let contentType: string | null = 'não chamado'
    server.use(
      listar([comentario()]),
      http.delete(`${BASE}/comentarios/c1`, ({ request }) => {
        contentType = request.headers.get('content-type')
        return HttpResponse.json({ status: 'sucesso', mensagem: 'ok' })
      }),
    )
    render(<Painel />)
    await userEvent.click(await screen.findByRole('button', { name: 'Apagar comentário' }))
    await waitFor(() => expect(screen.queryByText('baixo atravessa aqui')).not.toBeInTheDocument())
    expect(contentType).toBeNull()
  })

  it('esconde resolver e apagar de quem não pode', async () => {
    server.use(listar([comentario()]))
    render(<Painel papel="MUSICO" />)
    await screen.findByText('baixo atravessa aqui')
    expect(screen.queryByRole('button', { name: 'Marcar como resolvido' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Apagar comentário' })).not.toBeInTheDocument()
  })

  it('mostra o erro da API', async () => {
    server.use(
      listar([]),
      http.post(`${BASE}/layer/l1/comentarios`, () =>
        HttpResponse.json({ mensagem: 'Ação negada: apenas participantes do projeto podem comentar.' }, { status: 403 })),
    )
    render(<Painel />)
    await screen.findByText(/Nenhum comentário/)
    await userEvent.type(screen.getByLabelText('Texto do comentário'), 'oi')
    await userEvent.click(screen.getByRole('button', { name: 'Comentar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('apenas participantes')
  })
})
