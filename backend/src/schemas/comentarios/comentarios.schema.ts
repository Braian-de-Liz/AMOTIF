import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

// Limite generoso para a posição: 3 horas de áudio.
const MAX_SEGUNDOS = 3 * 60 * 60;

const Comentario = Type.Object({
    id: Type.String({ format: 'uuid' }),
    camadaId: Type.String({ format: 'uuid' }),
    segundos: Type.Number(),
    texto: Type.String(),
    versaoNumero: Type.Union([Type.Integer(), Type.Null()]),
    resolvido: Type.Boolean(),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' }),
    autor: Type.Object({
        id: Type.String({ format: 'uuid' }),
        nome_completo: Type.String(),
        avatar_url: Type.Union([Type.String(), Type.Null()])
    })
});

const camadaParams = Type.Object({ id: Type.String({ format: 'uuid' }) });
const comentarioParams = Type.Object({ id: Type.String({ format: 'uuid' }) });

const listar_comentarios_schema = {
    schema: {
        tags: ['comentarios'],
        description: 'Lista os comentários de uma camada, em ordem de posição no áudio',
        security: [{ bearerAuth: [] }],
        params: camadaParams,
        response: {
            200: Type.Object({
                status: Type.String(),
                comentarios: Type.Array(Comentario)
            }),
            ...Error_schema
        }
    }
};

const criar_comentario_schema = {
    schema: {
        tags: ['comentarios'],
        description: 'Comenta um instante (em segundos) do áudio de uma camada',
        security: [{ bearerAuth: [] }],
        params: camadaParams,
        body: Type.Object({
            segundos: Type.Number({ minimum: 0, maximum: MAX_SEGUNDOS }),
            texto: Type.String({ minLength: 1, maxLength: 500 })
        }),
        response: {
            201: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                comentario: Comentario
            }),
            ...Error_schema
        }
    }
};

const atualizar_comentario_schema = {
    schema: {
        tags: ['comentarios'],
        description: 'Edita o texto (só o autor) ou marca o comentário como resolvido/aberto',
        security: [{ bearerAuth: [] }],
        params: comentarioParams,
        body: Type.Object({
            texto: Type.Optional(Type.String({ minLength: 1, maxLength: 500 })),
            resolvido: Type.Optional(Type.Boolean())
        }, { minProperties: 1 }),
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                comentario: Comentario
            }),
            ...Error_schema
        }
    }
};

const deletar_comentario_schema = {
    schema: {
        tags: ['comentarios'],
        description: 'Remove um comentário (autor do comentário ou dono do projeto)',
        security: [{ bearerAuth: [] }],
        params: comentarioParams,
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String()
            }),
            ...Error_schema
        }
    }
};

export { listar_comentarios_schema, criar_comentario_schema, atualizar_comentario_schema, deletar_comentario_schema, MAX_SEGUNDOS };
