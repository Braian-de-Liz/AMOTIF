import { z } from "zod";
import { Error_schema } from "../error/erro_schema.js";
import { autenticarJWT } from "../../hooks/JWT_verific.js";

const get_notifications_schema = {
    prehandler: [autenticarJWT],
    schema: {
        tags: ['notificacoes'],
        description: 'Lista as notificações do usuário logado',
        security: [{ bearerAuth: [] }],
        response: {
            200: z.object({
                status: z.string(),
                notificacoes: z.array(z.object({
                    id: z.uuid(),
                    tipo: z.string(),
                    mensagem: z.string(),
                    lida: z.boolean(),
                    createdAt: z.coerce.date(),
                    userId: z.uuid(),
                    actorId: z.uuid().nullable(),
                    projetoId: z.uuid().nullable(),
                    origem: z.object({
                        nome_completo: z.string(),
                        avatar_url: z.string().nullable()
                    }).nullable().optional()
                }))
            }),
            ...Error_schema
        }
    }
}

export { get_notifications_schema };    