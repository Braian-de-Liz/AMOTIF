import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_permissao } from "../../hooks/verificar_permicao.js";
import { Error_schema } from "../error/erro_schema.js";

const aceitar_convite_schema = {
    preHandler: [autenticarJWT, verificar_permissao],
    schema: {
        params: z.object({
            id: z.string().uuid({ message: "ID do projeto inválido" })
        }),
        body: z.object({
            token_convite: z.string().uuid({ message: "Token de convite inválido" })
        }),
        response: {
            201: z.object({
                status: z.string(),
                mensagem: z.string(),
                projetoId: z.string()
            }),
            ...Error_schema
        }
    }
}


export { aceitar_convite_schema };