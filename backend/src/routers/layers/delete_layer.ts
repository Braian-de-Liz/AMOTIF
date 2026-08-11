import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_permissao_layer } from "../../hooks/verificar_dono_layer.js";
import { delete_lay_schema } from "../../schemas/layers/delete_a_layer.js";
import { extractPathFromUrl } from "../../lib/upload.js";

const delete_layer: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);
    Fastify.addHook("preHandler", verificar_permissao_layer);

    Fastify.delete("/layer/:id", delete_lay_schema, async (request, reply) => {

        const { id } = request.params;

        const layer = await Fastify.prisma.camada.findUnique({
            where: { id },
            select: {
                audio_url: true,
                versions: { select: { audio_url: true } }
            }
        });

        if (layer?.versions) {
            for (const version of layer.versions) {
                const path = extractPathFromUrl(version.audio_url);
                if (path) {
                    await Fastify.storage.deleteAudio(path);
                }
            }
        }

        if (layer?.audio_url) {
            const path = extractPathFromUrl(layer.audio_url);
            if (path) {
                await Fastify.storage.deleteAudio(path);
            }
        }

        await Fastify.prisma.camada.delete({ where: { id } });

        return reply.status(200).send({
            status: "sucesso",
            mensagem: "Camada removida"
        });
    });
};

export { delete_layer };
