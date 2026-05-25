import { z } from 'zod'
import { zbr } from 'br_standards_with_zod'

export const cadastroSchema = z.object({
  nome_completo: z.string().min(6, 'Nome deve ter pelo menos 6 caracteres').max(87, 'Nome deve ter no máximo 87 caracteres'),
  email: z.email('Email inválido').min(8, 'Email deve ter pelo menos 8 caracteres'),
  senha: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres').max(87, 'A senha deve ter no máximo 87 caracteres'),
  cpf: zbr.cpf('CPF inválido'),
})

export type CadastroSchema = z.infer<typeof cadastroSchema>
