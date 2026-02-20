import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";

const schema_get_user = {
    preHandler: [autenticarJWT],
    schema: {
        params: z.object({
            id: z.string().uuid({ message: "O formato do ID é inválido" })
        }),
        response: {
            200: z.object({
                status: z.string(),
                usuario: z.object({
                    id: z.string().uuid(),
                    nome_completo: z.string(),
                    email: z.string().email(),
                    bio: z.string().nullable(),
                    instrumentos: z.array(z.string()), 
                    createdAt: z.any(),
                    cpf: z.string(),
                })
            }),
            404: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
            500: z.object({
                status: z.string(),
                mensagem: z.string()
            })
        }
    }
};

export { schema_get_user };