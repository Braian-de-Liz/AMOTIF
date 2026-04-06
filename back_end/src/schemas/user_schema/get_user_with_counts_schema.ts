import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { Error_schema } from "../error/erro_schema.js";

const get_user_with_counts_schema = {
    preHandler: [autenticarJWT],
    schema: {
        tags: ['usuario'],
        description: 'Retorna os dados do perfil de um usuário específico com contagem de seguidores',
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
                    avatar_url: z.string().nullable(),
                    createdAt: z.any(),
                    _count: z.object({
                        seguidores: z.number(),
                        seguindo: z.number()
                    })
                })
            }),
            ...Error_schema
        }
    }
};

export { get_user_with_counts_schema };
