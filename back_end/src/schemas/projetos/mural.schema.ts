import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_permissao } from "../../hooks/verificar_permissao.js";
import { Error_schema } from "../error/erro_schema.js";

const mural_schema = {
    preHandler: [autenticarJWT, verificar_permissao],
    schema: {
        tags: ['projeto'],
        description: 'Cria uma mensagem no mural do projeto',
        security: [{ bearerAuth: [] }],
        params: z.object({
            projeto_id: z.uuid("ID do projeto inválido")
        }),
        body: z.object({
            conteudo: z.string().min(1, "O conteúdo não pode estar vazio"),
        }),
        response: {
            201: z.object({
                status: z.string(),
                mensagem: z.string(),
                mural: z.object({
                    id: z.uuid(),
                    conteudo: z.string(),
                    projetoId: z.uuid(),
                    autorId: z.uuid(),
                    createdAt: z.coerce.string(),
                })
            }),
            ...Error_schema
        },
    }
}

export { mural_schema };