// back_end\src\schemas\user_schema\schema_login.ts
import { z } from "zod";

const schema_login = {
    schema: {
        body: z.object({
            email: z.string().email(),
            senha: z.string().min(8)
        }),
        response: {
            200: z.object({
                status: z.string(),
                token: z.string(),
                usuario: z.object({
                    id: z.string(),
                    nome: z.string()
                })
            }),
            401: z.object({
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

export { schema_login };