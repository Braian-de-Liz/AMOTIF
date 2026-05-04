import { z } from "zod";
import { Error_schema } from "../error/erro_schema.js";
import { verificar_permissao } from "../../hooks/verificar_permissao.js";
import { verificar_dono_projeto } from "../../hooks/verificar_dono_projeto.js";

const Schema_del_project = {
    preHandler: [verificar_permissao, verificar_dono_projeto],
    schema: {
        tags: ['projeto'],
        description: 'Exclui o projeto',
        security: [{ bearerAuth: [] }],
        params: z.object({
            id: z.uuid({ message: "O ID fornecido não é um UUID válido" })
        }),
        body: z.object({
            senha: z.string().min(8, { message: "A senha deve ter no mínimo 8 caracteres" })
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

export { Schema_del_project };