import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_permissao } from "../../hooks/verificar_permicao.js";
import { Error_schema } from "../error/erro_schema.js";

const get_mural_schema = {
    preHandler: [autenticarJWT, verificar_permissao],
    schema: {
        tags: ['projeto'],
        description: 'Busca as mensagens do mural do projeto',
        security: [{ bearerAuth: [] }],

        params: z.object({
            projeto_id: z.uuid("ID do projeto inválido")
        }),
        response: {
            200: z.object({
                status: z.string(),
                mensagem: z.string(),
                mural: z.array(z.object({
                    id: z.uuid(),
                    conteudo: z.string(),
                    projetoId: z.uuid(),
                    autorId: z.uuid(),
                    createdAt: z.coerce.string(),
                }))
            }),
            ...Error_schema
        }
    }
}

export { get_mural_schema };