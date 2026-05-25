import { z } from 'zod'
import { zbr } from 'br_standards_with_zod'

export const cadastroSchema = z.object({
  nome_completo: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.email('Email inválido'),
  senha: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
  cpf: zbr.cpf('CPF inválido'),
})
