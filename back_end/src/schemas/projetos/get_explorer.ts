import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { Error_schema } from "../error/erro_schema.js";

const get_feed_schema = {
    preHandler: [autenticarJWT],
    schema: {
        tags: ['projeto'],
        description: 'Retorna um feed/explorador público de projetos',
        security: [{ bearerAuth: [] }],
        response: {
            200: z.object({
                status: z.string(),
                projetos: z.array(
                    z.object({
                        id: z.uuid(),
                        titulo: z.string(),
                        genero: z.enum([
                            "ROCK", "POP", "JAZZ", "BLUES", "FORRO", "METAL", 
                            "HIP_HOP", "ELECTRONIC", "CLASSICAL", "LO_FI", 
                            "INDIE", "SERTANEJO", "SAMBA", "MPB", "COUNTRY", 
                            "FUNK", "SOUNDTRACK", "REGGAE"
                        ]),
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
            ...Error_schema
        }
    }
};

export { get_feed_schema };