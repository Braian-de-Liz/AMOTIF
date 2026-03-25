import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_dono_projeto } from "../../hooks/verificar_dono_projeto.js";
import { Error_schema } from "../error/erro_schema.js";
import { z } from "zod";


const Deletar_Colab_schema = {
    preHandler: [autenticarJWT, verificar_dono_projeto],
    schema: {
        tags: ['colaboração'],
        params: z.object({
            projetoId: z.uuid(),
            userId: z.uuid()
        }),
        response: {
            200: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
            ...Error_schema
        }
        
    }

}


export { Deletar_Colab_schema };