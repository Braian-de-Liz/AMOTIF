import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const get_mural_schema = {
    schema: {
        tags: ['projeto'],
        description: 'Busca as mensagens do mural do projeto',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            projeto_id: Type.String({ format: 'uuid' })
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                mural: Type.Array(Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    conteudo: Type.String(),
                    projetoId: Type.String({ format: 'uuid' }),
                    autorId: Type.String({ format: 'uuid' }),
                    createdAt: Type.Unknown()
                }))
            }),
            ...Error_schema
        }
    }
}

export { get_mural_schema };