import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { z } from "zod";
import { Error_schema } from "../error/erro_schema.js";


const search_instrumento = {
    preHandler: [autenticarJWT],
    schema: {
        tags: ['search'],
        description: 'Procurar projetos com filtro por instrumento',
        querystring: z.object({
            instrumento: z.string().min(2),
            limite: z.number().optional(),
            pagina: z.number().optional()
        }),
        response: {
            200: z.object({
                status: z.string(),
                resultados: z.array(z.any())
            }),
            ...Error_schema
        }
    }
}

export { search_instrumento };