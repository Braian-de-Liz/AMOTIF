import { z } from "zod";
import { Error_schema } from "../error/erro_schema.js";

const search_project_schema = {
    schema: {
        tags: ['search'],
        description: 'Pesquisa por projetos musicais usando filtros',
        querystring: z.object({
            query: z.string().min(1).optional(),
            escala: z.string().optional(),
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