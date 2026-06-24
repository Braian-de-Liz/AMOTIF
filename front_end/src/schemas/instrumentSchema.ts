import { z } from 'zod'

export const instrumentSchema = z.object({
  instrumentos: z.array(z.string().min(1, 'Instrumento não pode ser vazio').max(50))
    .min(1, 'Adicione pelo menos um instrumento')
    .max(10, 'Máximo 10 instrumentos'),
})

export type InstrumentSchema = z.infer<typeof instrumentSchema>
