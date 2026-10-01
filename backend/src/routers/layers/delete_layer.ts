import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_autor_ou_dono_layer } from "../../hooks/verificar_dono_layer.js";
import { delete_lay_schema } from "../../schemas/layers/delete_a_layer.js";
import { deleteOwnedAudios, type AudioRef } from "../../lib/safe_delete.js";

const delete_layer: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);
    // Autor da camada ou dono do projeto.
    Fastify.addHook("preHandler", verificar_autor_ou_dono_layer);

    Fastify.delete("/layer/:id", delete_lay_schema, async (request, reply) => {

        const { id } = request.params;

        const layer = await Fastify.prisma.camada.findUnique({
            where: { id },
            select: {
                userId: true,
                audio_url: true,
                versions: { select: { audio_url: true, autorId: true } }
            }
        });

        if (layer) {
            const refs: AudioRef[] = [
                ...(layer.versions ?? []).map((v) => ({ url: v.audio_url, ownerId: v.autorId })),
                { url: layer.audio_url, ownerId: layer.userId }
            ];

            // Só apaga arquivos dentro do diretório de quem os enviou (bloqueia URLs forjadas/legadas).
            await deleteOwnedAudios(Fastify, refs);
        }

        await Fastify.prisma.camada.delete({ where: { id } });

        return reply.status(200).send({
            status: "sucesso",
            mensagem: "Camada removida"
        });
    });
};

export { delete_layer };
