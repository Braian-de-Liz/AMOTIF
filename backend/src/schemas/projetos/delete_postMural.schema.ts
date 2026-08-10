import { Type } from "@sinclair/typebox";
import { Error_schema } from "../error/erro_schema.js";

const schema_deleteMural = {
    schema: {
        tags: ['projeto', 'mural'],
        description: 'Exclui um comentário do mural do projeto',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            projetoId: Type.String({ format: 'uuid' }),
            comentarioId: Type.String({ format: 'uuid' })
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String()
            }),
            ...Error_schema
        }
    }
}

export { schema_deleteMural };