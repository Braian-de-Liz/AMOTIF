import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const GeneroEnum = Type.Union([
    Type.Literal("ROCK"), Type.Literal("POP"), Type.Literal("JAZZ"), Type.Literal("BLUES"),
    Type.Literal("FORRO"), Type.Literal("METAL"), Type.Literal("HIP_HOP"), Type.Literal("ELECTRONIC"),
    Type.Literal("CLASSICAL"), Type.Literal("LO_FI"), Type.Literal("INDIE"), Type.Literal("SERTANEJO"),
    Type.Literal("SAMBA"), Type.Literal("MPB"), Type.Literal("COUNTRY"), Type.Literal("FUNK"),
    Type.Literal("SOUNDTRACK"), Type.Literal("REGGAE")
]);

const projetoSchema = Type.Object({
    id: Type.String({ format: 'uuid' }),
    titulo: Type.String(),
    genero: GeneroEnum,
    descricao: Type.Union([Type.String(), Type.Null()]),
    bpm: Type.Number(),
    escala: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.Unknown()
});

const get_schemaPROJETC = {
    schema: {
        tags: ['projeto'],
        description: 'Retorna os projetos do usuário logado',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' })
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                projetos: Type.Array(projetoSchema)
            }),
            ...Error_schema
        }
    }
}

export { get_schemaPROJETC, projetoSchema };