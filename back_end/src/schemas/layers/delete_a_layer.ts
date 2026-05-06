import { z } from "zod";
import { Error_schema } from "../error/erro_schema.js";

const delete_lay_schema = {
    schema: {
        tags: ['camada'],
        description: 'Remove uma camada musical de um projeto',
        security: [{ bearerAuth: [] }],
        params: z.object({ id: z.uuid() }),
        response: {
            200: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
            ...Error_schema
        }
    }
}

export { delete_lay_schema };