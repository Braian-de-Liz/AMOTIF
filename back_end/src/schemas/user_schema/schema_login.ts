// back_end\src\schemas\user_schema\schema_login.ts
import { z } from "zod";

const schema_login = {
    schema: {
        body: z.object({
            email: z.string().email({ message: "E-mail inválido" }),
            senha: z.string().min(8, { message: "A senha deve ter no mínimo 8 caracteres" })
        }),
        response: {
            200: z.object({
                status: z.string(),
                token: z.string(),
                usuario: z.object({
                    id: z.string().uuid(),
                    nome: z.string(),
                    email: z.string().email()
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