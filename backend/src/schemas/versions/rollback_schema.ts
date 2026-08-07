import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const rollback_schema = {
    schema: {
        tags: ['versionamento'],
        description: 'Faz rollback da camada para uma versão anterior',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' }),
            versionId: Type.String({ format: 'uuid' })
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                versao: Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    versionNumber: Type.Number(),
                    mensagem: Type.Union([Type.String(), Type.Null()]),
                    createdAt: Type.String({ format: 'date-time' })
                })
            }),
            ...Error_schema
        }
    }
};

export { rollback_schema };
