import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { schema_upload_audio } from "../../schemas/upload/upload_schema.js";

const upload_audio: FastifyPluginAsyncTypebox = async (Fastify) => {
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
