import { z } from "zod";
import { Error_schema } from "../error/erro_schema.js";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { projetoSchema } from './get_schemaPROJETC.js';


const schema_post_project = {
    preHandler: [autenticarJWT],
    schema: {
        tags: ['projeto'],
        description: 'Cria um novo projeto musical',
        security: [{ bearerAuth: [] }],
        body: z.object({
            titulo: z.string().min(2),
            genero: z.enum([
                "ROCK", "POP", "JAZZ", "BLUES", "FORRO", "METAL", 
                "HIP_HOP", "ELECTRONIC", "CLASSICAL", "LO_FI", 
                "INDIE", "SERTANEJO", "SAMBA", "MPB", "COUNTRY", 
                "FUNK", "SOUNDTRACK", "REGGAE"
            ]),
            bpm: z.preprocess((val) => Number(val), z.number().int().min(40).max(300)),
            escala: z.string().optional(),
            descricao: z.string().optional(),
            audio_guia: z.url()
        }),
        response: {
            201: z.object({
                status: z.string(),
                mensagem: z.string(),
                projeto: projetoSchema
            }),
           ...Error_schema
        }
    }
}

export { schema_post_project };