import { z } from 'zod'

export const createLayerSchema = z.object({
  nome_trilha: z.string().min(3, 'Nome da trilha deve ter pelo menos 3 caracteres'),
  instrumento_tag: z.string().min(2, 'Instrumento deve ter pelo menos 2 caracteres'),
})

export type CreateLayerData = z.infer<typeof createLayerSchema>
