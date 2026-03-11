import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";

const get_feed_schema = {
    preHandler: [autenticarJWT],
    schema: {
        response: {
            200: z.object({
                status: z.string(),
                projetos: z.array(
                    z.object({
                        id: z.string().uuid(),
                        titulo: z.string(),
                        bpm: z.number(),
                        escala: z.string().nullable(),
                        descricao: z.string().nullable(),
                        audio_guia: z.string(),
                        createdAt: z.date(),
                        autor: z.object({
                            nome_completo: z.string(),
                            instrumentos: z.array(z.string())
                        })
                    })
                )
            }),
            500: z.object({
                status: z.string(),
                mensagem: z.string()
            })
        }
    }
};

export { get_feed_schema };