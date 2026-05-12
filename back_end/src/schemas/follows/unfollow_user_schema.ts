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
        ...Error_schema
    }
}
export { unfollow_schema };