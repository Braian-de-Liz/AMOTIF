import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const aceitar_convite_schema = {
    schema: {
        tags: ['colaboração'],
        description: 'Aceita um convite para participar de um projeto usando um token de convite',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' })
        }),
        body: Type.Object({
            token_convite: Type.String({ format: 'uuid' })
        }),
        response: {
            201: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                projetoId: Type.String()
            }),
            ...Error_schema
        }
    }
}

export { aceitar_convite_schema };