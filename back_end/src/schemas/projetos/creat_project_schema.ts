import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_permissao } from "../../hooks/verificar_permicao.js";
import { Error_schema } from "../error/erro_schema.js";

const schema_post_project = {
    preHandler: [autenticarJWT, verificar_permissao],
    schema: {
        tags: ['projeto'],
        description: 'Cria um novo projeto musical',
        security: [{ bearerAuth: [] }],
        params: z.object({
            id: z.uuid()
        }),

        body: z.object({
            titulo: z.string().min(2),
            bpm: z.preprocess((val) => Number(val), z.number().int().min(40).max(300)),
            escala: z.string().optional(),
            descricao: z.string().optional(),
            audio_guia: z.string().url()
        }),

        response: {
            201: z.object({
                status: z.string(),
                mensagem: z.string(),
                projeto: z.any().optional()
            }),
           ... Error_schema
        }
    }
}

export { schema_post_project };