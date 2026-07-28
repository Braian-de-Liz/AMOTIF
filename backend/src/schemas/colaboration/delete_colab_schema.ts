import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const Deletar_Colab_schema = {
    schema: {
        tags: ['colaboração'],
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            projetoId: Type.String({ format: 'uuid' }),
            userId: Type.String({ format: 'uuid' })
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String()
            }),
            ...Error_schema
        }
    }
}

export { Deletar_Colab_schema };