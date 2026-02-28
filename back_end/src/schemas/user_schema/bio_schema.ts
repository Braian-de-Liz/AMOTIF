import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_permissao } from "../../hooks/verificar_permicao.js";

const schema_bio = {
    preHandler: [autenticarJWT, verificar_permissao],
    schema: {
        body: z.object({
            bio: z.string().nullable()
        }),
        params: z.object({
            id: z.string().uuid({ message: "O formato do ID é inválido" })
        }),
        response: {
            403: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
            500: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
            200: z.object({
                status: z.string(),
                mensagem: z.string()
            })
        }
    }
}

''
export { schema_bio };