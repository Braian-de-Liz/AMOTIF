import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const schema_convite = {
    schema: {
        tags: ['colaboração'],
        description: 'Cria e envia um convite para um usuário participar de um projeto',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' })
        }),
        body: Type.Object({
            email_destinatario: Type.String({ format: 'email' }),
            cargo: Type.String({ minLength: 2, maxLength: 30 }),
            mensagem: Type.Optional(Type.String({ maxLength: 255 }))
        }),
        response: {
            201: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                convite: Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    projeto_id: Type.String({ format: 'uuid' }),
                    email_destinatario: Type.String({ format: 'email' }),
                    token_convite: Type.String(),
                    expira_em: Type.String()
                })
            }),
            ...Error_schema
        }
    }
}

export { schema_convite };