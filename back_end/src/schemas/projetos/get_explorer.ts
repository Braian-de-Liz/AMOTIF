import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const GeneroEnum = Type.Union([
    Type.Literal("ROCK"), Type.Literal("POP"), Type.Literal("JAZZ"), Type.Literal("BLUES"),
    Type.Literal("FORRO"), Type.Literal("METAL"), Type.Literal("HIP_HOP"), Type.Literal("ELECTRONIC"),
    Type.Literal("CLASSICAL"), Type.Literal("LO_FI"), Type.Literal("INDIE"), Type.Literal("SERTANEJO"),
    Type.Literal("SAMBA"), Type.Literal("MPB"), Type.Literal("COUNTRY"), Type.Literal("FUNK"),
    Type.Literal("SOUNDTRACK"), Type.Literal("REGGAE")
]);

const get_feed_schema = {
    schema: {
        tags: ['projeto'],
        description: 'Retorna um feed inteligente de projetos com filtros e status de curtida',
        security: [{ bearerAuth: [] }],
        querystring: Type.Object({
            genero: Type.Optional(GeneroEnum),
            instrumentoFaltante: Type.Optional(Type.String())
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                projetos: Type.Array(Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    titulo: Type.String(),
                    genero: Type.String(),
                    bpm: Type.Number(),
                    escala: Type.Union([Type.String(), Type.Null()]),
                    descricao: Type.Union([Type.String(), Type.Null()]),
                    audio_guia: Type.String(),
                    createdAt: Type.Unknown(),
                    autor: Type.Object({
                        nome_completo: Type.String(),
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