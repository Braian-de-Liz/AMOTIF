import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const get_user_with_counts_schema = {
    schema: {
        tags: ['usuario'],
        description: 'Retorna os dados do perfil de um usuário específico com contagem de seguidores',
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
                    avatar_url: Type.Union([Type.String(), Type.Null()]),
                    createdAt: Type.Unknown(),
                    _count: Type.Object({
                        seguidores: Type.Number(),
                        seguindo: Type.Number()
                    })
                })
            }),
            ...Error_schema
        }
    }
};

export { get_user_with_counts_schema };