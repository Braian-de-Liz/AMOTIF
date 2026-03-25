import { z } from "zod";
import { verificar_permissao } from "../../hooks/verificar_permicao.js";
import { autenticarJWT } from "../../hooks/JWT_verific.js";


const get_schemaPROJETC = {
    preHandler: [autenticarJWT, verificar_permissao],
    schema: {
        tags: ['projeto'],
        description: 'Retorna os projetos do usuário logado',
        security: [{ bearerAuth: [] }],
        params: z.object({
            id: z.uuid()
        }),

        response: {
            200: z.object({
                status: z.string(),
                mensagem: z.string(),
                projetos: z.array(
                    z.object({
                        id: z.string().uuid(),
                        titulo: z.string(),
                        descricao: z.string().nullable(),
                        bpm: z.number(),
                        escala: z.string().nullable(),
                        createdAt: z.date(),
                    })
                )
            }),
            400: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
            404: z.object({
                status: z.string(),
                mensagem: z.string(),
                projetos: z.array(z.object({
                    id: z.string().uuid(),
                    titulo: z.string(),
                    descricao: z.string().nullable(),
                    bpm: z.number(),
                    escala: z.string().nullable(),
                    createdAt: z.date(),
                }))
            }),
            403: z.object({
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

export { get_schemaPROJETC };