import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const delete_lay_schema = {
    schema: {
        tags: ['camada'],
        description: 'Remove uma camada musical de um projeto',
        security: [{ bearerAuth: [] }],
        params: Type.Object({ id: Type.String({ format: 'uuid' }) }),
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String()
            }),
            ...Error_schema
        }
    }
}

export { delete_lay_schema };