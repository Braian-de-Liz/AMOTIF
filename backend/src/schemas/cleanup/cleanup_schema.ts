import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const cleanup_schema = {
    schema: {
        tags: ['manutenção'],
        description: 'Remove convites expirados e notificações lidas com mais de 7 dias',
        security: [{ bearerAuth: [] }],
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                convitesRemovidos: Type.Number(),
                notificacoesRemovidas: Type.Number()
            }),
            ...Error_schema
        }
    }
};

export { cleanup_schema };
