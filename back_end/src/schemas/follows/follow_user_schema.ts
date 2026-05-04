import { z } from 'zod'
import { Error_schema } from '../error/erro_schema.js';

const follow_schema = {
    preHandler: [],
    schema: {
        tags: ['seguidores'],
        description: 'Segue um usuário (músico) pelo ID',
        security: [{ bearerAuth: [] }],
        params: z.object({
            followingId: z.uuid({ message: "ID do músico inválido" })
        }),
        ...Error_schema
    }
}

export { follow_schema };