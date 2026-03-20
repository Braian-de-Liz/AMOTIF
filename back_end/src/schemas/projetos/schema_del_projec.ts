import { z } from "zod";
import { verificar_dono_projeto } from "../../hooks/verificar_dono_projeto.js";
import { verificar_permissao } from "../../hooks/verificar_permicao.js";
import { Error_schema } from "../error/erro_schema.js";


const schema_del_project = {
    preHandler: [verificar_permissao, verificar_dono_projeto],
    schema: {
        params: z.object({
            id: z.string().uuid({ message: "ID do projeto inválido." })
        }),
        body: z.object({
            senha: z.string().min(1, "A senha é obrigatória para confirmar a exclusão.")
        }),
        response: {
            202: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
            ...Error_schema
        }
    }
};



export { schema_del_project };