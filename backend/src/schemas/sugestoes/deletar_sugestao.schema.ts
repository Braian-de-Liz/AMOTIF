import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const deletar_sugestao_schema = {
    schema: {
        tags: ['sugestoes'],
        description: 'Deleta uma sugestão (autor ou dono do projeto)',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' })
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String()
            }),
            ...Error_schema
        }
    }
};

export { deletar_sugestao_schema };
