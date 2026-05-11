import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const follow_schema = {
    preHandler: [],
    schema: {
        tags: ['seguidores'],
        description: 'Segue um usuário (músico) pelo ID',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            followingId: Type.String({ format: 'uuid' })
        }),
        ...Error_schema
    }
}

export { follow_schema };