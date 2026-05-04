import { z } from "zod";
import { verificar_permissao } from "../../hooks/verificar_permissao.js"
import { Error_schema } from "../error/erro_schema.js";
const schema_get_user = {
    preHandler: [verificar_permissao],
    schema: {
        tags: ['usuario'],
        description: 'Retorna os dados do perfil de um usuário específico',
        security: [{ bearerAuth: [] }],
        params: z.object({
            id: z.uuid({ message: "O formato do ID é inválido" })
        }),
        response: {
            200: z.object({
                status: z.string(),
                usuario: z.object({
                    id: z.uuid(),
                    nome_completo: z.string(),
                    email: z.email(),
                    bio: z.string().nullable(),
                    instrumentos: z.array(z.string()),
                    createdAt: z.any(),
                })
            }),
            ...Error_schema
        }
    }
};

export { schema_get_user };