export interface ProjectCount {
  likes: number
  camadas: number
}

export interface ProjectAuthor {
  id: string
  nome_completo: string
  avatar_url?: string | null
}

export interface Camada {
  id: string
  nome?: string
  instrumento_tag?: string
  audio_url: string
  delay_offset: number
  volume_padrao: number
  esta_aprovada: boolean
  autor?: { nome_completo: string }
}

export interface Project {
  id: string
  titulo: string
  genero: string
  bpm: number
  escala?: string | null
  descricao?: string | null
  audio_guia?: string
  audio_metadata?: Record<string, unknown>
  autor?: ProjectAuthor
  camadas?: Camada[]
  userHasLiked?: boolean
  userHasFavorited?: boolean
  _count: ProjectCount
}

export interface AudioMeta {
  nome: string
  tamanhoMB: number
  duracaoSegundos: number
  codec: string
  sampleRate: number
}

export interface Genre {
  label: string
  value: string
}
