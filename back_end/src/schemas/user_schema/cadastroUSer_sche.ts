import { z } from 'zod'
import { zbr } from 'br_standards_with_zod'

const schema_register = {
    schema: {
        body: z.object({
            nome_completo: z.string().min(6).max(87),
            email: z.string().email().min(8),
            senha: z.string().min(8).max(87),
            cpf: zbr.cpf("cpf inválido"),
        }),
        response: {
            201: z.object({
                status: z.string(),
                mensagem: z.string(),
                userId: z.string().uuid()
            }),
            400: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
            500: z.object({
                status: z.string(),
                mensagem: z.string()
            })
        }
    }
}

export { schema_register };