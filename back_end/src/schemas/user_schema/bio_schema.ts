import { z } from "zod";
import { Error_schema } from "../error/erro_schema.js";

const schema_bio = {
    schema: {
        tags: ['usuario'],
        description: 'Atualiza a biografia do perfil do usuário',
        security: [{ bearerAuth: [] }],
        body: z.object({
            bio: z.string().nullable()
        }),
        params: z.object({
            id: z.uuid({ message: "O formato do ID é inválido" })
        }),
        response: {
            200: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
            ...Error_schema
        }
    }
}

''
export { schema_bio };