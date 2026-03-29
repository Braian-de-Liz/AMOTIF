// schemas/projetos/like_project_schema.ts
import { z } from 'zod'
import { autenticarJWT } from '../../hooks/JWT_verific.js';
import { Error_schema } from '../error/erro_schema.js';

const like_project_schema = {
    preHandler: [autenticarJWT],
    schema: {
        tags: ['colaboração'],
        description: 'permite que usário d^ like em projetos alheios',
        security: [{ bearerAuth: [] }],
        params: z.object({
            projetoId: z.uuid()
        }),
        response: {
            200: z.object({
                status: z.string(),
                liked: z.boolean(),
                count: z.number()
            }),
            ...Error_schema
        }
    }
}

export { like_project_schema };