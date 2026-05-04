import { z } from "zod";
import { verificar_permissao } from "../../hooks/verificar_permissao.js";
import { Error_schema } from "../error/erro_schema.js";

const instrumentos_schema = {
    preHandler: [verificar_permissao],
    schema: {
        tags: ['usuario'],
        description: 'Atualiza os instrumentos tocados pelo usuário',
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