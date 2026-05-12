import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const get_notifications_schema = {
    schema: {
        tags: ['notificacoes'],
        description: 'Lista as notificações do usuário logado',
        security: [{ bearerAuth: [] }],
        response: {
            200: Type.Object({
                status: Type.String(),
                notificacoes: Type.Array(Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    tipo: Type.String(),
                    mensagem: Type.String(),
                    lida: Type.Boolean(),
                    createdAt: Type.Unknown(),
                    userId: Type.String({ format: 'uuid' }),
                    actorId: Type.Union([Type.String({ format: 'uuid' }), Type.Null()]),
                    projetoId: Type.Union([Type.String({ format: 'uuid' }), Type.Null()]),
                    origem: Type.Optional(Type.Union([
                        Type.Object({
                            nome_completo: Type.String(),
                            avatar_url: Type.Union([Type.String(), Type.Null()])
                        }),
                        Type.Null()
                    ]))
                }))
            }),
            ...Error_schema
        }
    }
}

export { get_notifications_schema };