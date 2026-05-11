import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const schema_login = {
    schema: {
        tags: ['usuario'],
        description: 'Autentica um usuário e retorna um token JWT',
        body: Type.Object({
            email: Type.String({ format: 'email' }),
            senha: Type.String({ minLength: 8 })
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                token: Type.String(),
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

export { schema_login };