import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const like_project_schema = {
    schema: {
        tags: ['colaboração'],
        description: 'Permite que usuário dê like em projetos alheios',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            projetoId: Type.String({ format: 'uuid' })
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                liked: Type.Boolean(),
                count: Type.Number()
            }),
            ...Error_schema
        }
    }
}

export { like_project_schema };