import type { StatusProjeto, PapelEfetivo } from '../utility/papeis'

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
  nome_trilha?: string
  instrumento_tag?: string
  audio_url: string
  delay_offset: number
  volume_padrao: number
  /** BPM em que a camada foi gravada; null/ausente = mesmo BPM do projeto. */
  bpm_original?: number | null
  /** Transposição aplicada na reprodução, em semitons (-12 a 12). */
  transposicao_semitons?: number
  esta_aprovada: boolean
  autor?: { id?: string; nome_completo: string }
  versaoAtual?: {
    id: string
    numero: number
    mensagem?: string | null
    criadaEm: string
  } | null
  totalVersoes?: number
  totalBranches?: number
}

export interface Project {
  id: string
  titulo: string
  genero: string
  bpm: number
  escala?: string | null
  descricao?: string | null
  status?: StatusProjeto
  /** Papel de quem está vendo o projeto; null se não participa. */
  meu_papel?: PapelEfetivo | null
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

export interface BranchVersion {
  id: string
  versionNumber: number
  createdAt: string
}

export interface BranchAuthor {
  id: string
  nome_completo: string
  avatar_url?: string | null
}

export interface LayerBranch {
  id: string
  nome: string
  camadaId: string
  isMain: boolean
  baseVersion: BranchVersion
  headVersion: BranchVersion
  createdBy: BranchAuthor
  createdAt: string
  updatedAt: string
}
