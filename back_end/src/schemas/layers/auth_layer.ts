import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";

const schema_auth_layer = {
    preHandler: [autenticarJWT],
    schema: {
        params: z.object({ layerId: z.string().uuid() }),
        body: z.object({ aprovada: z.boolean() }),
        response: {
            200: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
            403: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
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
}

export { schema_auth_layer };