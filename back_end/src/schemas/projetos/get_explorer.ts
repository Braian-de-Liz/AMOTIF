import { z } from "zod";
import { Error_schema } from "../error/erro_schema.js";

const get_feed_schema = {
    preHandler: [],
    schema: {
        tags: ['projeto'],
        description: 'Retorna um feed inteligente de projetos com filtros e status de curtida',
        security: [{ bearerAuth: [] }],
        querystring: z.object({
            genero: z.string().optional(),
            instrumentoFaltante: z.string().optional(),
        }),
        response: {
            200: z.object({
                status: z.string(),
                projetos: z.array(
                    z.object({
                        id: z.uuid(),
                        titulo: z.string(),
                        genero: z.string(),
                        bpm: z.number(),
                        escala: z.string().nullable(),
                        descricao: z.string().nullable(),
                        audio_guia: z.string(),
                        createdAt: z.date(),
                        autor: z.object({
                            nome_completo: z.string(),
                            instrumentos: z.array(z.string())
                        }),
                        _count: z.object({
                            likes: z.number(),
                            camadas: z.number(),
                            colaboradores: z.number()
                        }),
                        userHasLiked: z.boolean()
                    })
                )
            }),
            ...Error_schema
        }
    }
};

export { get_feed_schema };