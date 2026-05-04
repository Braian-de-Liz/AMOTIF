import { z } from "zod";
import { verificar_dono_projeto } from "../../hooks/verificar_dono_projeto.js";
import { Error_schema } from "../error/erro_schema.js";

const projectBodySchema = z.object({
    titulo: z.string().min(3, { message: "O título deve ter no mínimo 3 caracteres" }),
    descricao: z.string().nullable(),
    genero: z.enum([
        "ROCK", "POP", "JAZZ", "BLUES", "FORRO", "METAL", 
        "HIP_HOP", "ELECTRONIC", "CLASSICAL", "LO_FI", 
        "INDIE", "SERTANEJO", "SAMBA", "MPB", "COUNTRY", 
        "FUNK", "SOUNDTRACK", "REGGAE"
    ]),
    bpm: z.number().positive({ message: "O BPM deve ser um número positivo" }),
    escala: z.string().nullable(),
});

const update_project_schema = {
    preHandler: [verificar_dono_projeto],
    schema: {
        tags: ['projeto'],
        description: 'Atualiza parcialmente os metadados do projeto (Título, BPM, Gênero, etc)',
        security: [{ bearerAuth: [] }],
        params: z.object({
            id: z.uuid({ message: "ID do projeto inválido" })
        }),
        body: projectBodySchema.partial(),
        response: {
            200: z.object({
                status: z.string(),
                mensagem: z.string(),
                projeto: z.object({
                    id: z.uuid(),
                    titulo: z.string(),
                    genero: z.string(),
                    bpm: z.number(),
                    descricao: z.string().nullable(),
                    escala: z.string().nullable(),
                    updatedAt: z.date()
                })
            }),
            ...Error_schema
        }
    }
};

export { update_project_schema };