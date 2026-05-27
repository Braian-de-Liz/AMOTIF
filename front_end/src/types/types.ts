export interface ApiResponse<T = unknown> {
  status: string
  mensagem?: string
}

export interface ApiError {
  status: string
  mensagem: string
}

export interface SearchResults {
  type: 'projetos' | 'usuarios'
  data: unknown[]
}

export interface LoginResponse extends ApiResponse {
  token: string
  usuario: {
    id: string
    email: string
    nome: string
  }
}

export interface Notification {
  id: string
  tipo: string
  lida: boolean
  mensagem: string
  criado_em: string
  actorId?: string
  projetoId?: string
}

export interface Convite {
  id: string
  projetoId: string
  email_destinatario: string
  token_convite: string
  cargo: string
  remetenteNome?: string
  expira_em: string
}

export interface Colaborador {
  id: string
  userId: string
  projetoId: string
  cargo: string
  usuario: {
    id: string
    nome_completo: string
    avatar_url?: string | null
  }
}

export interface MuralPost {
  id: string
  conteudo: string
  criado_em: string
  autor: {
    id: string
    nome_completo: string
    avatar_url?: string | null
  }
}
