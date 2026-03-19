import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";

const schema_colaboretors = {
    preHandler: [autenticarJWT],
    schema: {
        params: z.object({
            id: z.string().uuid({ message: "ID do projeto inválido" })
        }),
        response: {
            200: z.array(
                z.object({
                    id: z.string().uuid(),
                    nome: z.string(),
                    email: z.string().email(),
                    avatar_url: z.string().url().optional(),
                    instrumentos: z.array(z.string()),
                    joined_at: z.string().datetime()
                })
            ),
            404: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
            500: z.object({
                status: z.string(),
                mensagem: z.string()
            })
        }
    }
};

export { schema_colaboretors };