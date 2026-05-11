import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const schema_register = {
    schema: {
        tags: ['usuario'],
        description: 'Registra um novo usuário no sistema',
        body: Type.Object({
            nome_completo: Type.String({ minLength: 6, maxLength: 87 }),
            email: Type.String({ format: 'email', minLength: 8 }),
            senha: Type.String({ minLength: 8, maxLength: 87 }),
            cpf: Type.String({ pattern: '^[0-9]{11}$' })
        }),
        response: {
            201: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                userId: Type.String({ format: 'uuid' })
            }),
            ...Error_schema
        }
    }
}

export { schema_register };