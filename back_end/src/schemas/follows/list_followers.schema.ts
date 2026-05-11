import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const list_followers_schema = {
    preHandler: [],
    schema: {
        tags: ['seguidores'],
        description: 'Lista os seguidores do usuário',
        security: [{ bearerAuth: [] }],
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                follows: Type.Array(Type.Object({
                    followerId: Type.String({ format: 'uuid' }),
                    followingId: Type.String({ format: 'uuid' }),
                    createdAt: Type.Unknown(),
                    follower: Type.Object({
                        id: Type.String({ format: 'uuid' }),
                        nome_completo: Type.String(),
                        avatar_url: Type.Union([Type.String(), Type.Null()]),
                        bio: Type.Union([Type.String(), Type.Null()])
                    })
                })),
                total: Type.Number()
            }),
            ...Error_schema
        }
    }
};

export { list_followers_schema };