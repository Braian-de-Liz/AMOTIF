import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const schema_refresh = {
    schema: {
        tags: ['usuario'],
        description: 'Renova o access token usando um refresh token válido',
        cookies: Type.Object({
            refresh_token: Type.String()
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                usuario: Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    nome: Type.String(),
                    email: Type.String({ format: 'email' })
                })
            }),
            ...Error_schema
        }
    }
}

export { schema_refresh };
