import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const search_instrumento = {
    schema: {
        tags: ['search'],
        security: [{ bearerAuth: [] }],
        description: 'Procurar projetos com filtro por instrumento',
        querystring: Type.Object({
            instrumento: Type.String({ minLength: 2 }),
            limite: Type.Optional(Type.Number()),
            pagina: Type.Optional(Type.Number())
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                resultados: Type.Array(Type.Unknown())
            }),
            ...Error_schema
        }
    }
}

export { search_instrumento };