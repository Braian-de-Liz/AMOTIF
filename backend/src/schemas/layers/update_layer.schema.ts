import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const update_layer_schema = {
    schema: {
        tags: ['camada'],
        description: 'Atualiza os dados de uma camada musical existente',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' })
        }),
        body: Type.Object({
            nome_trilha: Type.String({ minLength: 1 }),
            audio_url: Type.String({ format: 'uri' }),
            instrumento_tag: Type.String({ minLength: 1 }),
            delay_offset: Type.Optional(Type.Integer()),
            volume_padrao: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
            esta_aprovada: Type.Optional(Type.Boolean())
        }),
        response: {
            200: Type.Object({
                status: Type.Literal("sucesso"),
                mensagem: Type.String()
            }),
            ...Error_schema
        }
    }
}

export { update_layer_schema };