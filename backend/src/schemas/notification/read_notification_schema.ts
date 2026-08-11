import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const read_notification_schema = {
    schema: {
        tags: ['notificacoes'],
        description: 'Marca uma notificação como lida',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' })
        }),
        response: {
            200: Type.Object({
                status: Type.String()
            }),
            ...Error_schema
        }
    }
};

export { read_notification_schema };
