import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_permissao_layer } from "../../hooks/verificar_dono_layer.js";
import { Error_schema } from "../error/erro_schema.js";

const delete_lay_schema = {
    preHandler: [autenticarJWT, verificar_permissao_layer],
    schema: {
        tags: ['camada'],
        security: [{ bearerAuth: [] }],
        params: z.object({ id: z.uuid() }),
        response: {
            200: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
            ...Error_schema
        }
    }
}

export { delete_lay_schema };