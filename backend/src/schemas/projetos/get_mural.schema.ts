import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const get_mural_schema = {
    schema: {
        tags: ['projeto'],
        description: 'Busca as mensagens do mural do projeto',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' })
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                mural: Type.Array(Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    conteudo: Type.String(),
                    projetoId: Type.String({ format: 'uuid' }),
                    autor: Type.Object({
                        id: Type.String({ format: 'uuid' }),
                        nome_completo: Type.String(),
                        avatar_url: Type.Union([Type.String(), Type.Null()])
                    }),
                    criado_em: Type.String({ format: 'date-time' })
                }))
            }),
            ...Error_schema
        }
    }
}

export { get_mural_schema };