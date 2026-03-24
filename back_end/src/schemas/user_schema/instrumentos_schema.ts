import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_permissao } from "../../hooks/verificar_permicao.js";
import { Error_schema } from "../error/erro_schema.js";

const instrumentos_schema = {
    preHandler: [autenticarJWT, verificar_permissao],
    schema: {
        tags: ['usuario'],
        security: [{ bearerAuth: [] }],
        body: z.object({
            instrumentos: z.array(z.string())
        }),
        params: z.object({
            id: z.uuid({ message: "O formato do ID é inválido" })
        }),
        response: {
            200: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
            ...Error_schema
        }
    }
}

export { instrumentos_schema };