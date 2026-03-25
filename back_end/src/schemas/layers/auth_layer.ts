import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { Error_schema } from "../error/erro_schema.js";

const schema_auth_layer = {
    preHandler: [autenticarJWT],
    schema: {
        tags: ['camada'],
        description: 'Autoriza ou desautoriza uma camada de um projeto',
        security: [{ bearerAuth: [] }],
        params: z.object({ layerId: z.uuid() }),
        body: z.object({ aprovada: z.boolean() }),
        response: {
            200: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
            ... Error_schema
        }
    }
}

export { schema_auth_layer };