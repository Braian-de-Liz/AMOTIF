import { z } from 'zod'
import { autenticarJWT } from '../../hooks/JWT_verific.js'
import { Error_schema } from '../error/erro_schema.js';

const follow_schema = {
    preHandler: [autenticarJWT],
    schema: {
        security: [{ bearerAuth: [] }],
        params: z.object({
            followingId: z.uuid({ message: "ID do músico inválido" })
        }),
        ...Error_schema
    }
}

export { follow_schema };