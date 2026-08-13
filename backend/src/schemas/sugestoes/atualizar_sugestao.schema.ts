import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const StatusSugestaoEnum = Type.Union([
    Type.Literal('ABERTA'),
    Type.Literal('EM_ANDAMENTO'),
    Type.Literal('RESOLVIDA')
]);

const atualizar_sugestao_schema = {
    schema: {
        tags: ['sugestoes'],
        description: 'Atualiza o status de uma sugestão (apenas o dono do projeto)',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' })
        }),
        body: Type.Object({
            status: StatusSugestaoEnum
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                sugestao: Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    titulo: Type.String(),
                    descricao: Type.String(),
                    status: StatusSugestaoEnum,
                    atualizado_em: Type.String({ format: 'date-time' })
                })
            }),
            ...Error_schema
        }
    }
};

export { atualizar_sugestao_schema };
