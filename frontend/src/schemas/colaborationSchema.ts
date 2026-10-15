import { z } from 'zod'

export const inviteSchema = z.object({
  email_destinatario: z.email('Email inválido'),
  // A API exige um cargo (rótulo livre, 2 a 30 caracteres); vazio vira "membro".
  cargo: z
    .string()
    .trim()
    .max(30, 'A função pode ter no máximo 30 caracteres')
    .optional()
    .transform(v => v || 'membro')
    .pipe(z.string().min(2, 'A função precisa de ao menos 2 caracteres')),
  papel: z.enum(['PRODUTOR', 'MUSICO', 'OUVINTE']).default('MUSICO'),
})

export type InviteSchema = z.infer<typeof inviteSchema>
