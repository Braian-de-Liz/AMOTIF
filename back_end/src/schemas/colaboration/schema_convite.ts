import { z } from "zod";
import { verificar_dono_projeto } from "../../hooks/verificar_dono_projeto.js";
import { Error_schema } from "../error/erro_schema.js";

const schema_convite = {
    preHandler: [verificar_dono_projeto],
    schema: {
        tags: ['colaboração'],
        description: 'Cria e envia um convite para um usuário participar de um projeto',
        security: [{ bearerAuth: [] }],
        params: z.object({
            id: z.uuid({ message: "ID do projeto inválido" })
        }),
        body: z.object({
            email_destinatario: z.email({ message: "E-mail inválido" }),
            cargo: z.string().min(2, "O cargo deve ter pelo menos 2 caracteres").max(30),
            mensagem: z.string().max(255).optional()
        }),
        response: {
            201: z.object({
                status: z.string(),
                mensagem: z.string(),
                convite: z.object({
                    id: z.string().uuid(),
                    projeto_id: z.string().uuid(),
                    email_destinatario: z.string().email(),
                    token_convite: z.string(),
                    expira_em: z.coerce.string()
                })
            }),
            ...Error_schema
        }
    }
}

export { schema_convite };