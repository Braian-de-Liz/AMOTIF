import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const List_invite_schema = {
    schema: {
        tags: ['colaboração'],
        description: 'Lista todos os convites de um projeto específico',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' })
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                convites: Type.Array(Type.Object({
                    id: Type.String(),
                    email_destinatario: Type.String(),
                    cargo: Type.String(),
                    mensagem: Type.Union([Type.String(), Type.Null()]),
                    expira_em: Type.Unknown(),
                    projetoId: Type.String()
                }))
            }),
            ...Error_schema
        }
    }
}

export { List_invite_schema };