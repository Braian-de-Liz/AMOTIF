import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const restore_schema = {
    schema: {
        tags: ['versionamento'],
        description: 'Restaura vers\u00e3o anterior sem criar nova vers\u00e3o (in-place)',
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

export { restore_schema };