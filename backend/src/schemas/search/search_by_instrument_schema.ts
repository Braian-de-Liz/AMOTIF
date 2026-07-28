import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const search_instrumento = {
    schema: {
        tags: ['search'],
        security: [{ bearerAuth: [] }],
        description: 'Procurar músicos por instrumento ou nome',
        querystring: Type.Object({
            instrumento: Type.Optional(Type.String({ minLength: 2 })),
            query: Type.Optional(Type.String({ minLength: 2 })),
            limite: Type.Optional(Type.Number()),
            pagina: Type.Optional(Type.Number())
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                resultados: Type.Array(Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    nome_completo: Type.String(),
                    avatar_url: Type.Union([Type.String(), Type.Null()]),
                    instrumentos: Type.Array(Type.String()),
                    bio: Type.Union([Type.String(), Type.Null()]),
                    _count: Type.Object({
                        seguidores: Type.Number(),
                        projetos_criados: Type.Number()
                    }),
                    isFollowing: Type.Boolean()
                }))
            }),
            ...Error_schema
        }
    }
}

export { search_instrumento };