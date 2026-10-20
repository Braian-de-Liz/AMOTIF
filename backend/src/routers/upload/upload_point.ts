import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import type { FastifyReply, FastifyRequest } from "fastify";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { schema_upload_audio } from "../../schemas/upload/upload_schema.js";
import { MAX_FILE_SIZE, MULTIPART_OVERHEAD, MENSAGEM_LIMITE } from "../../lib/upload.js";

/**
 * Rejeita a requisição antes de ler o corpo quando o Content-Length já denuncia
 * um arquivo acima do limite. Nada chega ao bucket nesse caso.
 */
export async function rejeitarCorpoGrande(request: FastifyRequest, reply: FastifyReply) {
    const header = request.headers["content-length"];
    if (!header) return;

    const tamanho = Number(header);
    if (Number.isFinite(tamanho) && tamanho >= MAX_FILE_SIZE + MULTIPART_OVERHEAD) {
        return reply.status(413).send({
            status: "erro",
            mensagem: MENSAGEM_LIMITE
        });
    }
}

const upload_audio: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", rejeitarCorpoGrande);
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.post("/upload", schema_upload_audio, async (request, reply) => {
        const userId = request.user.id;
        const file = await request.file();

        if (!file || file.fieldname !== "audio") {
            return reply.status(400).send({
                status: "erro",
                mensagem: "Campo 'audio' não encontrado no formulário"
            });
        }
        
        const result = await Fastify.storage.uploadAudio(userId, file);

        return reply.status(200).send({
            status: "sucesso",
            fileUrl: result.fileUrl,
            path: result.path
        });
    });
};

export { upload_audio };
