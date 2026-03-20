import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_permissao } from "../../hooks/verificar_permicao.js";
import { Error_schema } from "../error/erro_schema.js";

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
            ...Error_schema
        }
    }
}

''
export { schema_bio };