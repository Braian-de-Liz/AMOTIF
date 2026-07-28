import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const schema_bio = {
    schema: {
        tags: ['usuario'],
        description: 'Atualiza a biografia do perfil do usuário',
        security: [{ bearerAuth: [] }],
        body: Type.Object({
            bio: Type.Union([Type.String(), Type.Null()])
        }),
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

export { schema_bio };