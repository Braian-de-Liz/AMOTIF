import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const schema_colaboretors = {
    schema: {
        tags: ['colaboração'],
        description: 'Lista todos os colaboradores de um projeto com seus respectivos cargos',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' })
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                colaborators: Type.Object({
                    colaboradores: Type.Array(Type.Object({
                        cargo: Type.Union([Type.String(), Type.Null()]),
                        joinedAt: Type.Unknown(),
                        usuario: Type.Object({
                            id: Type.String({ format: 'uuid' }),
                            nome_completo: Type.String(),
                            email: Type.String({ format: 'email' }),
                            avatar_url: Type.Optional(Type.Union([Type.String(), Type.Null()])),
                            instrumentos: Type.Array(Type.String())
                        })
                    }))
                })
            }),
            ...Error_schema
        }
    }
};

export { schema_colaboretors };