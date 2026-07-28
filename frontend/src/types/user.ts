export interface UserCount {
  seguidores: number
  seguindo: number
  projetos?: number
  camadas?: number
  likes?: number
}

export interface User {
  id: string
  nome_completo: string
  email?: string
  avatar_url?: string | null
  bio?: string | null
  instrumentos?: string[]
  isFollowing?: boolean
  _count?: UserCount
}

export interface UserSearchResult extends User {
  isFollowing: boolean
}

export interface FollowData {
  followerId: string
  followingId: string
  follower: User
}

export interface FollowResponse {
  follows: FollowData[]
  total: number
}
