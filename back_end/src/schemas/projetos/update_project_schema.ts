import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const GeneroEnum = Type.Union([
    Type.Literal("ROCK"), Type.Literal("POP"), Type.Literal("JAZZ"), Type.Literal("BLUES"),
    Type.Literal("FORRO"), Type.Literal("METAL"), Type.Literal("HIP_HOP"), Type.Literal("ELECTRONIC"),
    Type.Literal("CLASSICAL"), Type.Literal("LO_FI"), Type.Literal("INDIE"), Type.Literal("SERTANEJO"),
    Type.Literal("SAMBA"), Type.Literal("MPB"), Type.Literal("COUNTRY"), Type.Literal("FUNK"),
    Type.Literal("SOUNDTRACK"), Type.Literal("REGGAE")
]);

const update_project_schema = {
    schema: {
        tags: ['projeto'],
        description: 'Atualiza parcialmente os metadados do projeto (Título, BPM, Gênero, etc)',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' })
        }),
        body: Type.Partial(Type.Object({
            titulo: Type.String({ minLength: 3 }),
            descricao: Type.Union([Type.String(), Type.Null()]),
            genero: GeneroEnum,
            bpm: Type.Number({ minimum: 1 }),
            escala: Type.Union([Type.String(), Type.Null()]),
        })),
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                projeto: Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    titulo: Type.String(),
                    genero: Type.String(),
                    bpm: Type.Number(),
                    descricao: Type.Union([Type.String(), Type.Null()]),
                    escala: Type.Union([Type.String(), Type.Null()]),
                    updatedAt: Type.Unknown()
                })
            }),
            ...Error_schema
        }
    }
};

export { update_project_schema };