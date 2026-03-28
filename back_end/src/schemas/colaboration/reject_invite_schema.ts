import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { Error_schema } from "../error/erro_schema.js";

const reject_schema_invite = {
    preHandler: [autenticarJWT],
    schema:{
        security: [{ bearerAuth: [] }],
        tags: ['colaboração'],
        description: 'Recusa um convite de colaboração recebido',
        params: z.object({
            projetoId: z.uuid() 
        }),
        response:{
            200: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
            ...Error_schema
        }
    }
}

export { reject_schema_invite };