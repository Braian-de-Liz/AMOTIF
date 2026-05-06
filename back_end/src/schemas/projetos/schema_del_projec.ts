import { z } from "zod";
import { Error_schema } from "../error/erro_schema.js";


const schema_del_project = {
    schema: {
        tags: ['projeto'],
        description: 'Exclui um projeto existente, exigindo confirmação de senha',
        security: [{ bearerAuth: [] }],
        params: z.object({
            id: z.uuid({ message: "ID do projeto inválido." })
        }),
        body: z.object({
            senha: z.string().min(8, "A senha é obrigatória para confirmar a exclusão.")
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



export { schema_del_project };