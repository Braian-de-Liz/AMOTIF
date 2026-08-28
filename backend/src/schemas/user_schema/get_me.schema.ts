import { Type } from '@sinclair/typebox';
import { Error_schema } from "../../schemas/error/erro_schema.js";

const get_me_schema = {
    schema: {
        tags: ['usuario'],
        description: 'Retorna os dados do usuário autenticado',
        security: [{ bearerAuth: [] }],
        response: {
            200: Type.Object({
                status: Type.String(),
                usuario: Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    nome_completo: Type.String(),
                    email: Type.String({ format: 'email' }),
                    bio: Type.Union([Type.String(), Type.Null()]),
                    instrumentos: Type.Array(Type.String()),
                    avatar_url: Type.Union([Type.String(), Type.Null()]),
                })
            }),
            ...Error_schema
        }
    }
};

export { get_me_schema };