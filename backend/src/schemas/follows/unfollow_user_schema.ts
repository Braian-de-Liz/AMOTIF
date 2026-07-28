import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const unfollow_schema = {
    schema: {
        tags: ['seguidores'],
        description: 'Para de seguir um usuário (músico) pelo ID',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' })
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String()
            }),
            ...Error_schema
        }
    }
}
export { unfollow_schema };