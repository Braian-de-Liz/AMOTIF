import { z } from 'zod'

const generos = ["ROCK", "POP", "JAZZ", "BLUES", "FORRO", "METAL", "HIP_HOP", "ELECTRONIC", "CLASSICAL", "LO_FI", "INDIE", "SERTANEJO", "SAMBA", "MPB", "COUNTRY", "FUNK", "SOUNDTRACK", "REGGAE"]

export const projectSchema = z.object({
  titulo: z.string().min(1, 'Título obrigatório'),
  genero: z.enum(generos, { error: 'Gênero inválido' }),
  bpm: z.number().int('BPM deve ser um número inteiro').min(1, 'BPM mínimo 1').max(999, 'BPM máximo 999'),
  escala: z.string().optional(),
  descricao: z.string().optional(),
})

export { generos }
