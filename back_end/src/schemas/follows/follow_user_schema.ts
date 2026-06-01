import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const follow_schema = {
    schema: {
        tags: ['seguidores'],
        description: 'Segue um usuário (músico) pelo ID',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            followingId: Type.String({ format: 'uuid' })
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                seguindo: Type.Boolean()
            }),
            ...Error_schema
        }
    }
}

export { follow_schema };