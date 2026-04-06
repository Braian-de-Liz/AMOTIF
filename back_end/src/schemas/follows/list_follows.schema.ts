import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { Error_schema } from "../error/erro_schema.js";

const list_follows_schema = {
    preHandler: [autenticarJWT],
    schema: {
        tags: ['seguidores'],
        description: 'Lista os follows',
        security: [{ bearerAuth: [] }],
        response: {
            200: z.object({
                status: z.string(),
                mensagem: z.string(),
                follows: z.array(
                    z.object({
                        followerId: z.string().uuid(),
                        followingId: z.string().uuid(),
                        createdAt: z.date()
                    })
                ),
                total: z.number()
            }),
            ...Error_schema
        }
    }
};

export { list_follows_schema };