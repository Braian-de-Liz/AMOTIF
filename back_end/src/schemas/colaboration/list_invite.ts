// back_end\src\schemas\colaboration\list_invite.js
import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_permissao } from "../../hooks/verificar_permicao.js";
import { Error_schema } from "../error/erro_schema.js";

const List_invite_schema = {
    preHandler: [autenticarJWT, verificar_permissao],
    schema: {
        tags: ['colaboração'],
        description: 'Lista todos os convites de um projeto específico',
        security: [{ bearerAuth: [] }], 
        params: z.object({
            id: z.uuid({ message: "ID do projeto deve ser um UUID válido" })
        }),
        response: {
            200: z.object({
                status: z.string(),
                convites: z.array(z.object({
                    id: z.string(),
                    email_destinatario: z.string(),
                    cargo: z.string(),
                    mensagem: z.string().nullable(),
                    expira_em: z.date().or(z.string()),
                    projetoId: z.string()
                }))
            }),
            ...Error_schema
        }
    }
}

export { List_invite_schema };