import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const schema_auth_layer = {
    schema: {
        tags: ['camada'],
        description: 'Autoriza ou desautoriza uma camada de um projeto',
        security: [{ bearerAuth: [] }],
        params: Type.Object({ layerId: Type.String({ format: 'uuid' }) }),
        body: Type.Object({ aprovada: Type.Boolean() }),
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String()
            }),
            ...Error_schema
        }
    }
}

export { schema_auth_layer };