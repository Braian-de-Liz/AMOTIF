import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const schema_details_project = {
    schema: {
        tags: ['projeto'],
        description: 'Retorna os detalhes completos de um projeto específico',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' })
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                projeto: Type.Object({
                    id: Type.String(),
                    titulo: Type.String(),
                    bpm: Type.Number(),
                    audio_guia: Type.String(),
                    descricao: Type.Union([Type.String(), Type.Null()]),
                    escala: Type.Union([Type.String(), Type.Null()]),
                    createdAt: Type.Unknown(),
                    autor: Type.Object({
                        nome_completo: Type.String(),
                        avatar_url: Type.Union([Type.String(), Type.Null()])
                    }),
                    camadas: Type.Array(Type.Object({
                        id: Type.String(),
                        nome_trilha: Type.String(),
                        audio_url: Type.String(),
                        instrumento_tag: Type.String(),
                        volume_padrao: Type.Number(),
                        delay_offset: Type.Number(),
                        esta_aprovada: Type.Boolean(),
                        createdAt: Type.Unknown(),
                        autor: Type.Object({
                            nome_completo: Type.String()
                        })
                    }))
                })
            }),
            ...Error_schema
        }
    }
};

export { schema_details_project };