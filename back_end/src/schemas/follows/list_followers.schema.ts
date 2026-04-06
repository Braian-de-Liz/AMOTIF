import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { Error_schema } from "../error/erro_schema.js";

const list_followers_schema = {
    preHandler: [autenticarJWT],
    schema: {
        tags: ['seguidores'],
        description: 'Lista os seguidores do usuário',
        security: [{ bearerAuth: [] }],
        response: {
            200: z.object({
                status: z.string(),
                mensagem: z.string(),
                follows: z.array(
                    z.object({
                        followerId: z.uuid(),
                        followingId: z.uuid(),
                        createdAt: z.date(),
                        follower: z.object({
                            id: z.uuid(),
                            nome_completo: z.string(),
                            avatar_url: z.string().nullable(),
                            bio: z.string().nullable()
                        })
                    })
                ),
                total: z.number()
            }),
            ...Error_schema
        }
    }
};

export { list_followers_schema };
