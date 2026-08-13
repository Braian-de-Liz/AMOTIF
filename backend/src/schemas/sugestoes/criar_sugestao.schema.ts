import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const StatusSugestaoEnum = Type.Union([
    Type.Literal('ABERTA'),
    Type.Literal('EM_ANDAMENTO'),
    Type.Literal('RESOLVIDA')
]);

const criar_sugestao_schema = {
    schema: {
        tags: ['sugestoes'],
        description: 'Cria uma sugestão para um projeto',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' })
        }),
        body: Type.Object({
            titulo: Type.String({ minLength: 3, maxLength: 100 }),
            descricao: Type.String({ minLength: 1, maxLength: 2000 })
        }),
        response: {
            201: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                sugestao: Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    titulo: Type.String(),
                    descricao: Type.String(),
                    status: StatusSugestaoEnum,
                    autor: Type.Object({
                        id: Type.String({ format: 'uuid' }),
                        nome_completo: Type.String(),
                        avatar_url: Type.Union([Type.String(), Type.Null()])
                    }),
                    criado_em: Type.String({ format: 'date-time' })
                })
            }),
            ...Error_schema
        }
    }
};

export { criar_sugestao_schema };
