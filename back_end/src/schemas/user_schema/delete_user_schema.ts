// back_end\src\schemas\user_schema\delete_user_schema.ts
import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js"
import { verificar_permissao } from "../../hooks/verificar_permicao.js";
import { Error_schema } from "../error/erro_schema.js";

const Schema_del_user = {
    preHandler: [autenticarJWT, verificar_permissao],
    schema: {
        security: [{ bearerAuth: [] }],
        params: z.object({
            id: z.string().uuid({ message: "O ID fornecido não é um UUID válido" })
        }),
        body: z.object({
            senha: z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres" })
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