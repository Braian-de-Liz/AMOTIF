// back_end\src\schemas\user_schema\delete_user_schema.ts
import { z } from "zod";
import { verificar_permissao } from "../../hooks/verificar_permissao.js";
import { Error_schema } from "../error/erro_schema.js";

const Schema_del_user = {
    preHandler: [verificar_permissao],
    schema: {
        tags: ['usuario'],
        description: 'Exclui a conta do usuário logado',
        security: [{ bearerAuth: [] }],
        params: z.object({
            id: z.uuid({ message: "O ID fornecido não é um UUID válido" })
        }),
        body: z.object({
            senha: z.string().min(8, { message: "A senha deve ter no mínimo 6 caracteres" })
        }),
        response: {
            202: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
            ...Error_schema
        }
    }
};

export { Schema_del_user };