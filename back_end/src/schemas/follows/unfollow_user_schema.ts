import { z } from 'zod'
import { Error_schema } from "../error/erro_schema.js";

const unfollow_schema = {
    preHandler: [],
    schema: {
        tags: ['seguidores'],
        description: 'Para de seguir um usuário (músico) pelo ID',
        security: [{ bearerAuth: [] }],
        params: z.object({
            id: z.uuid({ error: 'formato inválido' })
        }),
        ...Error_schema
    }
}
export { unfollow_schema };