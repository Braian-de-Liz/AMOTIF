import { z } from 'zod'
import { zbr } from 'br_standards_with_zod'
import { Error_schema } from '../error/erro_schema.js';

const schema_register = {
    schema: {
        tags: ['usuario'],
        body: z.object({
            nome_completo: z.string().min(6).max(87),
            email: z.email().min(8),
            senha: z.string().min(8).max(87),
            cpf: zbr.cpf("cpf inválido"),
        }),
        response: {
            201: z.object({
                status: z.string(),
                mensagem: z.string(),
                userId: z.uuid()
            }),
            ...Error_schema
        }
    }
}

export { schema_register };