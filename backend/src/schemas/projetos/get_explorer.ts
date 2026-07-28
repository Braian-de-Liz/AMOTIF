import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';
import { GeneroEnum } from './genero.enum.js';

const get_feed_schema = {
    schema: {
        tags: ['projeto'],
        description: 'Retorna um feed inteligente de projetos com filtros e status de curtida',
        security: [{ bearerAuth: [] }],
        querystring: Type.Object({
            genero: Type.Optional(GeneroEnum),
            instrumentoFaltante: Type.Optional(Type.String()),
            cursor: Type.Optional(Type.String({ format: 'uuid' }))
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                nextCursor: Type.Union([Type.String({ format: 'uuid' }), Type.Null()]),
                projetos: Type.Array(Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    titulo: Type.String(),
                    genero: Type.String(),
                    bpm: Type.Number(),
                    escala: Type.Union([Type.String(), Type.Null()]),
                    descricao: Type.Union([Type.String(), Type.Null()]),
                    audio_guia: Type.String(),
                    createdAt: Type.String({ format: 'date-time' }),
                    autor: Type.Object({
                        nome_completo: Type.String({ minLength: 6 }),
                        instrumentos: Type.Array(Type.String())
                    }),
                    _count: Type.Object({
                        likes: Type.Number(),
                        camadas: Type.Number(),
                        colaboradores: Type.Number()
                    }),
                    userHasLiked: Type.Boolean(),
                    userHasFavorited: Type.Boolean()
                }))
            }),
            ...Error_schema
        }
    }
};

export { get_feed_schema };