import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const list_followers_schema = {
    schema: {
        tags: ['seguidores'],
        description: 'Lista os seguidores do usuário',
        security: [{ bearerAuth: [] }],
        querystring: Type.Object({
            cursor: Type.Optional(Type.String()),
            limit: Type.Optional(Type.String())
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                follows: Type.Array(Type.Object({
                    followerId: Type.String({ format: 'uuid' }),
                    followingId: Type.String({ format: 'uuid' }),
                    createdAt: Type.String({ format: "date-time" }),
                    follower: Type.Object({
                        id: Type.String({ format: 'uuid' }),
                        nome_completo: Type.String(),
                        avatar_url: Type.Union([Type.String(), Type.Null()]),
                        bio: Type.Union([Type.String(), Type.Null()])
                    })
                })),
                total: Type.Number(),
                nextCursor: Type.Union([Type.String(), Type.Null()])
            }),
            ...Error_schema
        }
    }
};

export { list_followers_schema };