import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';
import { projetoSchema } from './get_schemaPROJETC.js';

const GeneroEnum = Type.Union([
    Type.Literal("ROCK"), Type.Literal("POP"), Type.Literal("JAZZ"), Type.Literal("BLUES"),
    Type.Literal("FORRO"), Type.Literal("METAL"), Type.Literal("HIP_HOP"), Type.Literal("ELECTRONIC"),
    Type.Literal("CLASSICAL"), Type.Literal("LO_FI"), Type.Literal("INDIE"), Type.Literal("SERTANEJO"),
    Type.Literal("SAMBA"), Type.Literal("MPB"), Type.Literal("COUNTRY"), Type.Literal("FUNK"),
    Type.Literal("SOUNDTRACK"), Type.Literal("REGGAE")
]);

const schema_post_project = {
    preHandler: [],
    schema: {
        tags: ['projeto'],
        description: 'Cria um novo projeto musical',
        security: [{ bearerAuth: [] }],
        body: Type.Object({
            titulo: Type.String({ minLength: 2 }),
            genero: GeneroEnum,
            bpm: Type.Number({ minimum: 40, maximum: 300 }),
            escala: Type.Optional(Type.String()),
            descricao: Type.Optional(Type.String()),
            audio_guia: Type.String({ format: 'uri' })
        }),
        response: {
            201: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                projeto: Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    titulo: Type.String(),
                    genero: Type.String(),
                    bpm: Type.Number(),
                    escala: Type.Union([Type.String(), Type.Null()]),
                    descricao: Type.Union([Type.String(), Type.Null()]),
                    audio_guia: Type.String(),
                    userId: Type.String(),
                    createdAt: Type.Unknown(),
                    updatedAt: Type.Unknown()
                })
            }),
            ...Error_schema
        }
    }
}

export { schema_post_project };