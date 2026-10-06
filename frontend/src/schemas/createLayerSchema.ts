import { z } from 'zod'

export const createLayerSchema = z.object({
  nome_trilha: z.string().min(3, 'Nome da trilha deve ter pelo menos 3 caracteres'),
  instrumento_tag: z.string().min(2, 'Instrumento deve ter pelo menos 2 caracteres'),
  tag: z.string().max(50, 'Tag deve ter no máximo 50 caracteres').optional(),
})

export type CreateLayerData = z.infer<typeof createLayerSchema>
