import { z } from "zod";
import { Error_schema } from '../error/erro_schema.js'
import { autenticarJWT } from "../../hooks/JWT_verific.js";

const schema_details_project = {
    preHandler: [autenticarJWT],
    schema: {
        security: [{ bearerAuth: [] }],
        params: z.object({
            id: z.string().uuid({ message: "ID do projeto inválido" })
        }),
        response: {
            200: z.object({
                status: z.string(),
                mensagem: z.string(),
                projeto: z.object({
                    id: z.string(),
                    titulo: z.string(),
                    bpm: z.number(),
                    audio_guia: z.string(),
                    descricao: z.string().nullable(),
                    escala: z.string().nullable(),
                    createdAt: z.date(),
                    autor: z.object({
                        nome_completo: z.string(),
                        avatar_url: z.string().nullable()
                    }),
                    camadas: z.array(z.object({
                        id: z.string(),
                        nome_trilha: z.string(),
                        audio_url: z.string(),
                        instrumento_tag: z.string(),
                        volume_padrao: z.number(),
                        delay_offset: z.number(),
                        esta_aprovada: z.boolean(),
                        autor: z.object({
                            nome_completo: z.string()
                        })
                    }))
                })
            }),
            ... Error_schema
        }
    }
};

export { schema_details_project };