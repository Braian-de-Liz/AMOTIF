import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { z } from 'zod'
import { Error_schema } from "../error/erro_schema.js";

const unfollow_schema = {
    preHandler: [autenticarJWT],
    schema: {
        tags: ['seguidores'],
        security: [{ bearerAuth: [] }],
        params: z.object({
            id: z.uuid({ error: 'formato inválido' })
        }),
        ...Error_schema
    }
}
export { unfollow_schema };