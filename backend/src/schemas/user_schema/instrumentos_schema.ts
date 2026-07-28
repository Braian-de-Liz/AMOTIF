import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const instrumentos_schema = {
    schema: {
        tags: ['usuario'],
        description: 'Atualiza os instrumentos tocados pelo usuário',
        security: [{ bearerAuth: [] }],
        body: Type.Object({
            instrumentos: Type.Array(Type.String())
        }),
        params: Type.Object({
            id: Type.String({ format: 'uuid' })
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String()
            }),
            ...Error_schema
        }
    }
}

export { instrumentos_schema };