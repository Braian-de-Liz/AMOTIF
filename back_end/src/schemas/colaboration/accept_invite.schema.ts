import { z } from "zod";
import { Error_schema } from "../error/erro_schema.js";

const aceitar_convite_schema = {
    schema: {
        tags: ['colaboração'],
        description: 'Aceita um convite para participar de um projeto usando um token de convite',
        security: [{ bearerAuth: [] }],
        params: z.object({
            id: z.uuid({ message: "ID do projeto inválido" })
        }),
        body: z.object({
            token_convite: z.uuid({ message: "Token de convite inválido" })
        }),
        response: {
            201: z.object({
                status: z.string(),
                mensagem: z.string(),
                projetoId: z.string()
            }),
            ...Error_schema
        }
    }
}


export { aceitar_convite_schema };