import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_permissao } from "../../hooks/verificar_permicao.js";
import { Error_schema } from "../error/erro_schema.js";

const update_layer_schema = {
    preHandler: [autenticarJWT, verificar_permissao],
    schema: {
        security: [{ bearerAuth: [] }],
        params: z.object({
            id: z.uuid({ message: "ID do projeto inválido" })
        }),
        body: z.object({
            nome_trilha: z.string().min(1, "Nome da trilha não pode ser vazio"),
            audio_url: z.url("URL do áudio inválida"),
            instrumento_tag: z.string().min(1, "Tag do instrumento não pode ser vazia"),
            delay_offset: z.number().int("Delay offset deve ser um número inteiro").optional(),
            volume_padrao: z.number().min(0).max(1, "Volume padrão deve estar entre 0 e 1").optional(),
            esta_aprovada: z.boolean().optional()
        }),
        response: {
            200: z.object({
                status: z.literal("sucesso"),
                mensagem: z.string()
            }),
            ...Error_schema
        }
    }
}

export { update_layer_schema };