import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const Schema_del_user = {
    schema: {
        tags: ['usuario'],
        description: 'Exclui a conta do usuário logado',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' })
        }),
        body: Type.Object({
            senha: Type.String({ minLength: 8 })
        }),
        response: {
            202: Type.Object({
                status: Type.String(),
                mensagem: Type.String()
            }),
            ...Error_schema
        }
    }
};

export { Schema_del_user };