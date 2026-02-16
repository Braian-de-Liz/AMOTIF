import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js"

const Schema_del_user = {
    preHandler: [autenticarJWT],
    schema: {
        params: z.object({
            id: z.string().uuid({ message: "O ID fornecido não é um UUID válido" })
        }),
        body: z.object({
            senha: z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres" })
        }),
        response: {
            202: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
            400: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
            403: z.object({
                status: z.string(),
                mensagem: z.string()
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

export { Schema_del_user };