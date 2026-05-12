import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const GeneroEnum = Type.Union([
    Type.Literal("ROCK"), Type.Literal("POP"), Type.Literal("JAZZ"), Type.Literal("BLUES"),
    Type.Literal("FORRO"), Type.Literal("METAL"), Type.Literal("HIP_HOP"), Type.Literal("ELECTRONIC"),
    Type.Literal("CLASSICAL"), Type.Literal("LO_FI"), Type.Literal("INDIE"), Type.Literal("SERTANEJO"),
    Type.Literal("SAMBA"), Type.Literal("MPB"), Type.Literal("COUNTRY"), Type.Literal("FUNK"),
    Type.Literal("SOUNDTRACK"), Type.Literal("REGGAE")
]);

const search_project_schema = {
    schema: {
        tags: ['search'],
        security: [{ bearerAuth: [] }],
        description: 'Pesquisa por projetos musicais usando filtros',
        querystring: Type.Object({
            query: Type.Optional(Type.String({ minLength: 1 })),
            escala: Type.Optional(Type.String()),
            genero: Type.Optional(GeneroEnum),
            bpm_min: Type.Optional(Type.Number()),
            bpm_max: Type.Optional(Type.Number())
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                resultados: Type.Array(Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    titulo: Type.String(),
                    bpm: Type.Number(),
                    genero: Type.String(),
                    escala: Type.Union([Type.String(), Type.Null()]),
                    descricao: Type.Union([Type.String(), Type.Null()]),
                    createdAt: Type.Unknown(),
                    autor: Type.Object({
                        nome_completo: Type.String(),
                        avatar_url: Type.Union([Type.String(), Type.Null()])
                    }),
                    _count: Type.Object({
                        camadas: Type.Number(),
                        colaboradores: Type.Number()
                    })
                }))
            }),
            ...Error_schema
        }
    }
}

export { search_project_schema };