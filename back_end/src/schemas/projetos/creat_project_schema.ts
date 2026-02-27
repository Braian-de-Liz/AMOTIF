import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";

const schema_post_project = {
    preHandler: [autenticarJWT],
    schema: {
        body: z.object({})
    }
}

export { schema_post_project };