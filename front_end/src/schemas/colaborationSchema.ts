import { z } from 'zod'

export const inviteSchema = z.object({
  email_destinatario: z.email('Email inválido'),
})

export type InviteSchema = z.infer<typeof inviteSchema>
