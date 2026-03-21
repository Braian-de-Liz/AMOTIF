import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { Error_schema } from "../error/erro_schema.js";

const schema_colaboretors = {
    preHandler: [autenticarJWT],
    schema: {
        security: [{ bearerAuth: [] }],
        params: z.object({
            id: z.string().uuid({ message: "ID do projeto inválido" })
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
                                id: z.string().uuid(),
                                nome_completo: z.string(),
                                email: z.string().email(),
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