import { z } from "zod";
import { Error_schema } from "../error/erro_schema.js";

const read_all_notifications_schema = {
    prehandler: [],
    schema: {
        tags: ['notificacoes'],
        description: 'Marca todas as notificações do usuário logado como lidas',
        security: [{ bearerAuth: [] }],
        response: {
            200: z.object({
                status: z.string(),
                mensagem: z.string(),
                atualizadas: z.number()
            }),
            ...Error_schema
        }
    }
};

export { read_all_notifications_schema };