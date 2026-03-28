import { z } from "zod";
import { Error_schema } from "../error/erro_schema.js";
import { autenticarJWT } from "../../hooks/JWT_verific.js";


const GeneroEnum = z.enum([
    "ROCK", "POP", "JAZZ", "BLUES", "FORRO", "METAL", 
    "HIP_HOP", "ELECTRONIC", "CLASSICAL", "LO_FI", 
    "INDIE", "SERTANEJO", "SAMBA", "MPB", "COUNTRY", 
    "FUNK", "SOUNDTRACK", "REGGAE"
]);

const search_project_schema = {
    preHandler: [autenticarJWT],
    schema: {
        tags: ['search'],
        security: [{ bearerAuth: [] }],
        description: 'Pesquisa por projetos musicais usando filtros',
        querystring: z.object({
            query: z.string().min(1).optional(),
            escala: z.string().optional(),
            genero: GeneroEnum.optional(), 
            bpm_min: z.coerce.number().optional(),
            bpm_max: z.coerce.number().optional()
        }),
        response: {
            200: z.object({
                status: z.string(),
                resultados: z.array(z.object({
                    id: z.uuid(), 
                    titulo: z.string(),
                    bpm: z.number(),
                    genero: GeneroEnum, 
                    escala: z.string().nullable(),
                    descricao: z.string().nullable(),
                    createdAt: z.date(),
                    autor: z.object({
                        nome_completo: z.string(),
                        avatar_url: z.string().nullable()
                    }),
                    _count: z.object({
                        camadas: z.number(),
                        colaboradores: z.number()
                    })
                }))
            }),
            ...Error_schema
        }
    }
}

export { search_project_schema };