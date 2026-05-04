import { z } from "zod";
import { Error_schema } from "../error/erro_schema.js";

const schema_colaboretors = {
    preHandler: [],
    schema: {
        tags: ['colaboração'],
        description: 'Lista todos os colaboradores de um projeto com seus respectivos cargos',
        security: [{ bearerAuth: [] }],
        params: z.object({
            id: z.uuid({ message: "ID do projeto inválido" })
        }),
        response: {
            200: z.object({
                status: z.string(),
                mensagem: z.string(),
                colaborators: z.object({
                    colaboradores: z.array(
                        z.object({
                            cargo: z.string().nullable(),
                            joinedAt: z.coerce.string(), 
                            usuario: z.object({
                                id: z.uuid(),
                                nome_completo: z.string(),
                                email: z.email(),
                                avatar_url: z.string().nullable().optional(),
                                instrumentos: z.array(z.string())
                            })
                        })
                    )
                })
            }),
            ...Error_schema
        }
    }
};

export { schema_colaboretors };