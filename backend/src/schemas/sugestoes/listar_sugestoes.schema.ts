import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const StatusSugestaoEnum = Type.Union([
    Type.Literal('ABERTA'),
    Type.Literal('EM_ANDAMENTO'),
    Type.Literal('RESOLVIDA')
]);

const listar_sugestoes_schema = {
    schema: {
        tags: ['sugestoes'],
        description: 'Lista as sugestões de um projeto',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' })
        }),
        querystring: Type.Object({
            status: Type.Optional(StatusSugestaoEnum),
            cursor: Type.Optional(Type.String()),
            limit: Type.Optional(Type.String())
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                sugestoes: Type.Array(Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    titulo: Type.String(),
                    descricao: Type.String(),
                    status: StatusSugestaoEnum,
                    autor: Type.Object({
                        id: Type.String({ format: 'uuid' }),
                        nome_completo: Type.String(),
                        avatar_url: Type.Union([Type.String(), Type.Null()])
                    }),
                    criado_em: Type.String({ format: 'date-time' }),
                    atualizado_em: Type.String({ format: 'date-time' })
                })),
                nextCursor: Type.Union([Type.String(), Type.Null()])
            }),
            ...Error_schema
        }
    }
};

export { listar_sugestoes_schema };
