import { Error_schema } from "../error/erro_schema.js";
import { z } from "zod";


const Deletar_Colab_schema = {
    schema: {
        tags: ['colaboração'],
        security: [{ bearerAuth: [] }],
        params: z.object({
            projetoId: z.uuid(),
            userId: z.uuid()
        }),
        response: {
            200: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
            ...Error_schema
        }
        
    }

}


export { Deletar_Colab_schema };