import { http, HttpResponse } from 'msw'

const BASE_URL = 'http://localhost:3333/api'

export const handlers = [
  http.post(`${BASE_URL}/usuario/refresh`, () => {
    return HttpResponse.json({ status: 'success' })
  }),

  http.get(`${BASE_URL}/usuario/me`, () => {
    return HttpResponse.json({
      id: 'user-1',
      nome_completo: 'Teste User',
      email: 'teste@email.com',
      avatar_url: null,
      bio: 'Musico testador',
      instrumentos: ['Guitarra', 'Violao'],
    })
  }),

  http.get(`${BASE_URL}/projetos/feed`, () => {
    return HttpResponse.json([
      {
        id: 'proj-1',
        titulo: 'Projeto Teste',
        genero: 'ROCK',
        bpm: 120,
        descricao: 'Um projeto de teste',
        autor: { id: 'user-1', nome_completo: 'Teste User', avatar_url: null },
        _count: { likes: 5, favoritos: 2, camadas: 3 },
      },
    ])
  }),

  http.get(`${BASE_URL}/projetos/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      titulo: 'Projeto Teste',
      genero: 'ROCK',
      bpm: 120,
      escala: 'C',
      descricao: 'Descricao do projeto',
      autor: { id: 'user-1', nome_completo: 'Teste User', avatar_url: null },
      camadas: [],
      userHasLiked: false,
      userHasFavorited: false,
      _count: { likes: 0, favoritos: 0, camadas: 0 },
    })
  }),

  http.post(`${BASE_URL}/layers`, () => {
    return HttpResponse.json({
      status: 'success',
      mensagem: 'Layer criada com sucesso',
      layer: {
        id: 'layer-1',
        nome: 'Minha Trilha',
        instrumento_tag: 'Guitarra',
        audio_url: 'https://example.com/audio.mp3',
        delay_offset: 0,
        volume_padrao: 80,
        esta_aprovada: false,
      },
    })
  }),

  http.get(`${BASE_URL}/notificacoes`, () => {
    return HttpResponse.json([])
  }),

  http.get(`${BASE_URL}/colaboracao/convites`, () => {
    return HttpResponse.json([])
  }),

  http.get(`${BASE_URL}/projetos/usuario/:userId`, () => {
    return HttpResponse.json([])
  }),

  http.get(`${BASE_URL}/favoritos`, () => {
    return HttpResponse.json([])
  }),
]
