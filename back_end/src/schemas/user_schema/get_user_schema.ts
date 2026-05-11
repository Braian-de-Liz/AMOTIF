import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const schema_get_user = {
    schema: {
        tags: ['usuario'],
        description: 'Retorna os dados do perfil de um usuário específico',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' })
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                usuario: Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    nome_completo: Type.String(),
                    email: Type.String({ format: 'email' }),
                    bio: Type.Union([Type.String(), Type.Null()]),
                    instrumentos: Type.Array(Type.String()),
                    createdAt: Type.Unknown()
                })
            }),
            ...Error_schema
        }
    }
};

export { schema_get_user };