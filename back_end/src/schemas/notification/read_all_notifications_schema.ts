import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const read_all_notifications_schema = {
    schema: {
        tags: ['notificacoes'],
        description: 'Marca todas as notificações do usuário logado como lidas',
        security: [{ bearerAuth: [] }],
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                atualizadas: Type.Number()
            }),
            ...Error_schema
        }
    }
};

export { read_all_notifications_schema };