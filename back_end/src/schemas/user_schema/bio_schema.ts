import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";

const schema_bio = {
    preHandler: [autenticarJWT],
    schema: {
        body: z.object({
            bio: z.string().nullable()
        }),
        params: z.object({
            id: z.string().uuid({ message: "O formato do ID é inválido" })
        }),
        response: {

        }
    }
}

''
export { schema_bio };