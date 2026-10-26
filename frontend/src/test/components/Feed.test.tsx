import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { Feed } from '@/components/feed'
import { FeedbackProvider } from '@/contexts/FeedbackContext'

const BASE = 'http://localhost:3333/api'

const projeto = (id: string, titulo: string) => ({
  id, titulo, genero: 'ROCK', bpm: 100, descricao: null,
  autor: { id: 'u1', nome_completo: 'Autor Teste', avatar_url: null },
  _count: { likes: 0, camadas: 0 },
  userHasLiked: false, userHasFavorited: false,
})

function renderFeed() {
  return render(
    <MemoryRouter>
      <FeedbackProvider>
        <Feed />
      </FeedbackProvider>
    </MemoryRouter>
  )
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Feed', () => {
  it('mostra o esqueleto enquanto carrega', () => {
    renderFeed()
    expect(screen.getByRole('status', { name: 'Carregando projetos' })).toBeInTheDocument()
  })

  it('feed vazio convida a começar um projeto', async () => {
    server.use(http.get(`${BASE}/projetos/feed`, () => HttpResponse.json({ projetos: [], nextCursor: null })))
    renderFeed()

    expect(await screen.findByText('Nenhum projeto ainda')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Começar um projeto' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument()
  })

  it('com filtro ativo e sem resultado, oferece limpar os filtros', async () => {
    server.use(http.get(`${BASE}/projetos/feed`, ({ request }) => {
      const genero = new URL(request.url).searchParams.get('genero')
      return HttpResponse.json({ projetos: genero ? [] : [projeto('p1', 'Sem Filtro')], nextCursor: null })
    }))
    renderFeed()
    await screen.findByText('Sem Filtro')

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Gênero' }), 'JAZZ')
    expect(await screen.findByText('Nada com esses filtros')).toBeInTheDocument()

    const [limpar] = screen.getAllByRole('button', { name: 'Limpar filtros' })
    await userEvent.click(limpar)

    expect(await screen.findByText('Sem Filtro')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Gênero' })).toHaveValue('')
  })

  it('"Carregar mais" acrescenta a próxima página', async () => {
    server.use(http.get(`${BASE}/projetos/feed`, ({ request }) => {
      const cursor = new URL(request.url).searchParams.get('cursor')
      return cursor === 'c1'
        ? HttpResponse.json({ projetos: [projeto('p2', 'Segunda Página')], nextCursor: null })
        : HttpResponse.json({ projetos: [projeto('p1', 'Primeira Página')], nextCursor: 'c1' })
    }))
    renderFeed()
    await screen.findByText('Primeira Página')

    await userEvent.click(screen.getByRole('button', { name: 'Carregar mais' }))

    expect(await screen.findByText('Segunda Página')).toBeInTheDocument()
    expect(screen.getByText('Primeira Página')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Carregar mais' })).not.toBeInTheDocument()
  })

  it('erro de carregamento permite tentar de novo', async () => {
    let falhar = true
    server.use(http.get(`${BASE}/projetos/feed`, () => falhar
      ? HttpResponse.json({ mensagem: 'Servidor fora do ar' }, { status: 500 })
      : HttpResponse.json({ projetos: [projeto('p1', 'Voltou')], nextCursor: null })))
    renderFeed()

    expect(await screen.findByText('Servidor fora do ar')).toBeInTheDocument()
    expect(screen.queryByText('Nenhum projeto ainda')).not.toBeInTheDocument()

    falhar = false
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByText('Voltou')).toBeInTheDocument()
  })
})
