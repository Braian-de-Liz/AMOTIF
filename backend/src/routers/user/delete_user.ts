import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_permissao } from "../../hooks/verificar_permissao.js";
import { Schema_del_user } from "../../schemas/user_schema/delete_user_schema.js";
import { extractPathFromUrl } from "../../lib/upload.js";

const Deletar_user: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);
    Fastify.addHook("preHandler", verificar_permissao);

    Fastify.delete("/usuario/:id", Schema_del_user, async (request, reply) => {
        const { id } = request.params;
        const { senha } = request.body;

        const encontrar_user = await Fastify.prisma.user.findUnique({ where: { id } });

        if (!encontrar_user) {
            Fastify.log.error("usuário não encontrado");

            return reply.status(404).send({
                status: 'erro',
                mensagem: 'usuário não encontrado'
            });
        }

        const senha_true = await Bun.password.verify(senha, encontrar_user.senha);

        if (!senha_true) {
            Fastify.log.error("senha incorreta");

            return reply.status(400).send({
                status: 'erro',
                mensagem: 'senha incorreta'
            });
        }

        const projetos = await Fastify.prisma.projeto.findMany({
            where: { userId: id },
            select: {
                audio_guia: true,
                camadas: {
                    select: {
                        audio_url: true,
                        versions: { select: { audio_url: true } }
                    }
                }
            }
        });

        for (const projeto of projetos) {
            if (projeto.audio_guia) {
                const path = extractPathFromUrl(projeto.audio_guia);
                if (path) {
                    await Fastify.storage.deleteAudio(path);
                }
            }

            for (const camada of projeto.camadas) {
                if (camada.versions) {
                    for (const version of camada.versions) {
                        const path = extractPathFromUrl(version.audio_url);
                        if (path) {
                            await Fastify.storage.deleteAudio(path);
                        }
                    }
                }

                if (camada.audio_url) {
                    const path = extractPathFromUrl(camada.audio_url);
                    if (path) {
                        await Fastify.storage.deleteAudio(path);
                    }
                }
            }
        }

        await Fastify.prisma.user.delete({ where: { id } });

        return reply.status(202).send({
            status: 'sucesso',
            mensagem: 'usuário deletado com sucesso'
        });
    });
}

export { Deletar_user };
