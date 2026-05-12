import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const schema_layer = {
    schema: {
        tags: ['camada'],
        description: 'Cria uma nova camada (trilha de áudio) em um projeto',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            projetoId: Type.String({ format: 'uuid' })
        }),
        body: Type.Object({
            nome_trilha: Type.String({ minLength: 3 }),
            audio_url: Type.String({ format: 'uri' }),
            instrumento_tag: Type.String({ minLength: 2 }),
            delay_offset: Type.Optional(Type.Integer({ default: 0 })),
            volume_padrao: Type.Optional(Type.Number({ minimum: 0, maximum: 1.5, default: 1.0 }))
        }),
        response: {
            201: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                camada: Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    nome_trilha: Type.String(),
                    audio_url: Type.String(),
                    instrumento_tag: Type.String(),
                    delay_offset: Type.Number(),
                    volume_padrao: Type.Number(),
                    esta_aprovada: Type.Boolean(),
                    projetoId: Type.String(),
                    userId: Type.String(),
                    createdAt: Type.Unknown()
                })
            }),
            ...Error_schema
        }
    }
};

export { schema_layer };