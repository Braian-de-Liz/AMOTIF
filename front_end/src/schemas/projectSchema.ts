import { z } from 'zod'

const generos = ["ROCK", "POP", "JAZZ", "BLUES", "FORRO", "METAL", "HIP_HOP", "ELECTRONIC", "CLASSICAL", "LO_FI", "INDIE", "SERTANEJO", "SAMBA", "MPB", "COUNTRY", "FUNK", "SOUNDTRACK", "REGGAE"] as const

export const projectSchema = z.object({
  titulo: z.string().min(2, 'Título deve ter pelo menos 2 caracteres'),
  genero: z.enum(generos, { error: 'Gênero inválido' }),
  bpm: z.number().int('BPM deve ser um número inteiro').min(40, 'BPM mínimo 40').max(300, 'BPM máximo 300'),
  escala: z.string().optional(),
  descricao: z.string().optional(),
})

export type ProjectSchema = z.infer<typeof projectSchema>

export { generos }
