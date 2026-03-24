import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_permissao } from "../../hooks/verificar_permicao.js"
import { Error_schema } from "../error/erro_schema.js";
const schema_get_user = {
    preHandler: [autenticarJWT, verificar_permissao],
    schema: {
        tags: ['usuario'],
        security: [{ bearerAuth: [] }],
        params: z.object({
            id: z.uuid({ message: "O formato do ID é inválido" })
        }),
        response: {
            200: z.object({
                status: z.string(),
                usuario: z.object({
                    id: z.uuid(),
                    nome_completo: z.string(),
                    email: z.email(),
                    bio: z.string().nullable(),
                    instrumentos: z.array(z.string()),
                    createdAt: z.any(),
                })
            }),
            ...Error_schema
        }
    }
};

export { schema_get_user };