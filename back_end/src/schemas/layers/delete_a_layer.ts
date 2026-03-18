import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_permissao_layer } from "../../hooks/verificar_dono_layer.js";

const delete_lay_schema = {
    preHandler: [autenticarJWT, verificar_permissao_layer],
    schema: {
        params: z.object({ id: z.string().uuid() }),
        response: {
            200: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
            404: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
            403: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
            500: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
        }
    }
}

export { delete_lay_schema };