import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_permissao } from "../../hooks/verificar_permicao.js";

const schema_post_project = {
    preHandler: [autenticarJWT, verificar_permissao],
    schema: {
        params: z.object({
            id: z.string().uuid()
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
            400: z.object({
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

export { schema_post_project };