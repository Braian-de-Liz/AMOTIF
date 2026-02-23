import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";

const instrumentos_schema = {
    preHandler: [autenticarJWT],
    schema: {
        body: z.object({
            instrumentos: z.array(z.string())
        }),
        params: z.object({
            id: z.string().uuid({ message: "O formato do ID é inválido" })
        }),
        response: {
            200: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
            500: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
            400: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
            403: z.object({
                status: z.string(),
                mensagem: z.string()
            })
        }
    }
}

export { instrumentos_schema };