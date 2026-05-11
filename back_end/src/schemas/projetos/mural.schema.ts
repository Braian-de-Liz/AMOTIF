import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const mural_schema = {
    schema: {
        tags: ['projeto'],
        description: 'Cria uma mensagem no mural do projeto',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            projeto_id: Type.String({ format: 'uuid' })
        }),
        body: Type.Object({
            conteudo: Type.String({ minLength: 1 })
        }),
        response: {
            201: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                mural: Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    conteudo: Type.String(),
                    projetoId: Type.String({ format: 'uuid' }),
                    autorId: Type.String({ format: 'uuid' }),
                    createdAt: Type.Unknown()
                })
            }),
            ...Error_schema
        },
    }
}

export { mural_schema };