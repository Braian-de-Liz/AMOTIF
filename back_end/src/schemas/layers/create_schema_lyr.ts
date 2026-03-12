// back_end\src\schemas\layers\create_schema_lyr.ts
import { z } from "zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";

const schema_layer = {
    preHandler: [autenticarJWT],
    schema: {
        params: z.object({
            projetoId: z.string().uuid({ message: "ID do projeto inválido" })
        }),
        body: z.object({
            nome_trilha: z.string().min(3, "O nome da trilha deve ter no mínimo 3 caracteres"),
            audio_url: z.string().url("URL de áudio inválida"),
            instrumento_tag: z.string().min(2, "Selecione um instrumento válido"),
            delay_offset: z.number().int().default(0),
            volume_padrao: z.number().min(0).max(1.5).default(1.0)
        }),
        response: {
            201: z.object({
                status: z.string(),
                mensagem: z.string(),
                camada: z.object({
                    id: z.string().uuid(),
                    nome_trilha: z.string(),
                    audio_url: z.string(),
                    instrumento_tag: z.string(),
                    delay_offset: z.number(),
                    volume_padrao: z.number(),
                    esta_aprovada: z.boolean(),
                    projetoId: z.string(),
                    userId: z.string(),
                    createdAt: z.date()
                })
            }),
            404: z.object({
                status: z.string(),
                mensagem: z.string()
            }),

            500: z.object({
                status: z.string(),
                mensagem: z.string()
            }),
        }
    }
};

export { schema_layer };