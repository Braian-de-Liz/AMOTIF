import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const recupere_senha_schema = {
    schema: {
        tags: ['usuario'],
        body: Type.Object({
            senha: Type.String({ minLength: 8 }),
            nova_senha: Type.String({ minLength: 8 })
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String()
            }),
            ...Error_schema
        }
    }
}

export { recupere_senha_schema };