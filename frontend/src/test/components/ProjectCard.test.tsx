import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse, delay } from 'msw'
import { server } from '../mocks/server'
import { ProjectCard } from '@/components/project_Card'
import { FeedbackProvider } from '@/contexts/FeedbackContext'
import type { Project } from '@/types'

const BASE = 'http://localhost:3333/api'

const projeto = (o: Partial<Project> = {}): Project => ({
  id: 'p1',
  titulo: 'Riff de Teste',
  genero: 'ROCK',
  bpm: 120,
  descricao: 'Descrição',
  autor: { id: 'u1', nome_completo: 'Autor Teste', avatar_url: null },
  _count: { likes: 5, camadas: 2 },
  userHasLiked: false,
  userHasFavorited: false,
  ...o,
})

function renderCard(proj: Project) {
  return render(
    <MemoryRouter>
      <FeedbackProvider>
        <ProjectCard proj={proj} />
      </FeedbackProvider>
    </MemoryRouter>
  )
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('ProjectCard', () => {
  it('curtir responde na hora, antes do servidor', async () => {
    server.use(http.post(`${BASE}/like/p1`, async () => {
      await delay('infinite')
      return HttpResponse.json({})
    }))
    renderCard(projeto())

    await userEvent.click(screen.getByRole('button', { name: 'Curtir' }))

    const botao = screen.getByRole('button', { name: 'Descurtir' })
    expect(botao).toHaveAttribute('aria-pressed', 'true')
    expect(botao).toHaveTextContent('6')
  })

  it('desfaz a curtida e mostra o erro quando o servidor recusa', async () => {
    server.use(http.post(`${BASE}/like/p1`, () =>
      HttpResponse.json({ mensagem: 'Limite de curtidas' }, { status: 429 })))
    renderCard(projeto())

    await userEvent.click(screen.getByRole('button', { name: 'Curtir' }))

    expect(await screen.findByText('Limite de curtidas')).toBeInTheDocument()
    const botao = screen.getByRole('button', { name: 'Curtir' })
    expect(botao).toHaveAttribute('aria-pressed', 'false')
    expect(botao).toHaveTextContent('5')
  })

  it('ignora o segundo clique enquanto a curtida está pendente', async () => {
    let chamadas = 0
    server.use(http.post(`${BASE}/like/p1`, async () => {
      chamadas++
      await delay(50)
      return HttpResponse.json({ liked: true, count: 6 })
    }))
    renderCard(projeto())

    const user = userEvent.setup()
    await user.dblClick(screen.getByRole('button', { name: 'Curtir' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Descurtir' })).toHaveTextContent('6'))
    expect(chamadas).toBe(1)
  })

  it('favoritar também é otimista', async () => {
    server.use(http.post(`${BASE}/projetos/favoritos/p1`, async () => {
      await delay('infinite')
      return HttpResponse.json({})
    }))
    renderCard(projeto())

    await userEvent.click(screen.getByRole('button', { name: 'Adicionar aos favoritos' }))
    expect(screen.getByRole('button', { name: 'Remover dos favoritos' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('o título leva ao Studio e o autor ao perfil', () => {
    renderCard(projeto())
    expect(screen.getByRole('link', { name: 'Riff de Teste' })).toHaveAttribute('href', '/studio/p1')
    expect(screen.getByRole('link', { name: /Autor Teste/ })).toHaveAttribute('href', '/usuario/u1')
  })

  it('só mostra a prévia quando o projeto tem áudio guia', () => {
    const { unmount } = renderCard(projeto())
    expect(screen.queryByRole('button', { name: /Ouvir prévia/ })).not.toBeInTheDocument()
    unmount()

    renderCard(projeto({ audio_guia: 'https://x/guia.mp3' }))
    expect(screen.getByRole('button', { name: 'Ouvir prévia de Riff de Teste' })).toBeInTheDocument()
  })
})
