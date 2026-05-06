// back_end\src\schemas\user_schema\schema_login.ts
import { z } from "zod";
import { Error_schema } from "../error/erro_schema.js";

const schema_login = {
    schema: {
        tags: ['usuario'],
        description: 'Autentica um usuário e retorna um token JWT',
        body: z.object({
            email: z.email({ message: "E-mail inválido" }),
            senha: z.string().min(8, { message: "A senha deve ter no mínimo 8 caracteres" })
        }),
        response: {
            200: z.object({
                status: z.string(),
                token: z.string(),
                usuario: z.object({
                    id: z.uuid(),
                    nome: z.string(),
                    email: z.email()
                })
            }),
            ...Error_schema
        }
    }
}

export { schema_login };