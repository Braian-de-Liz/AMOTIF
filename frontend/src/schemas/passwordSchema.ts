import { z } from 'zod'

export const passwordSchema = z.object({
    senha: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    nova_senha: z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres'),
    confirmar_senha: z.string().min(8, 'Confirmação deve ter pelo menos 8 caracteres'),
}).refine(data => data.nova_senha === data.confirmar_senha, {
    message: 'As senhas não conferem',
    path: ['confirmar_senha'],
})

export type PasswordSchema = z.infer<typeof passwordSchema>
