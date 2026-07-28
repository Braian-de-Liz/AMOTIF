import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';
import { GeneroEnum } from './genero.enum.js';

const projetoSchema = Type.Object({
    id: Type.String({ format: 'uuid' }),
    titulo: Type.String(),
    genero: GeneroEnum,
    descricao: Type.Union([Type.String(), Type.Null()]),
    bpm: Type.Number(),
    escala: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String({ format: 'date-time' })
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