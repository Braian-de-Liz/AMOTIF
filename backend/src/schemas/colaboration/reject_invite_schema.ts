import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const reject_schema_invite = {
    schema: {
        security: [{ bearerAuth: [] }],
        tags: ['colaboração'],
        description: 'Recusa um convite de colaboração recebido',
        params: Type.Object({
            projetoId: Type.String({ format: 'uuid' })
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

export { reject_schema_invite };