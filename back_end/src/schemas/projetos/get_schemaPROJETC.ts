import { z } from "zod";
import { verificar_permissao } from "../../hooks/verificar_permicao.js";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { Error_schema } from "../error/erro_schema.js";

const projetoSchema = z.object({
    id: z.uuid(),
    titulo: z.string(),
    genero: z.enum([
        "ROCK", "POP", "JAZZ", "BLUES", "FORRO", "METAL", 
        "HIP_HOP", "ELECTRONIC", "CLASSICAL", "LO_FI", 
        "INDIE", "SERTANEJO", "SAMBA", "MPB", "COUNTRY", 
        "FUNK", "SOUNDTRACK", "REGGAE"
    ]),
    descricao: z.string().nullable(),
    bpm: z.number(),
    escala: z.string().nullable(),
    createdAt: z.date(),
});

const get_schemaPROJETC = {
    preHandler: [autenticarJWT, verificar_permissao],
    schema: {
        tags: ['projeto'],
        description: 'Retorna os projetos do usuário logado',
        security: [{ bearerAuth: [] }],
        params: z.object({
            id: z.uuid()
        }),
        response: {
            200: z.object({
                status: z.string(),
                mensagem: z.string(),
                projetos: z.array(projetoSchema)
            }),
            ...Error_schema
        }
    }
}

export { get_schemaPROJETC };