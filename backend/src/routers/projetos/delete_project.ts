import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_dono_projeto } from "../../hooks/verificar_dono_projeto.js";
import { Schema_del_project } from "../../schemas/projetos/del_project.schema.js";
import { deleteOwnedAudios, type AudioRef } from "../../lib/safe_delete.js";

const del_project: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);
    Fastify.addHook("preHandler", verificar_dono_projeto());

    Fastify.delete("/projetos/:id", Schema_del_project, async (request, reply) => {

        const { id } = request.params;
        const { senha } = request.body;
        const usuarioLogadoId = request.user.id;

        const user = await Fastify.prisma.user.findUnique({
            where: { id: usuarioLogadoId }
        });

        if (!user) {
            return reply.status(404).send({ status: 'erro', mensagem: "Usuário não encontrado" });
        }

        const check_password = await Bun.password.verify(senha, user.senha);

        if (!check_password) {
            Fastify.log.error("erro au autenticar senha");

            return reply.status(400).send({
                status: 'erro',
                mensagem: "Senha incorreta"
            });
        }

        const projeto = await Fastify.prisma.projeto.findUnique({
            where: { id },
            select: {
                userId: true,
                audio_guia: true,
                camadas: {
                    select: {
                        userId: true,
                        audio_url: true,
                        versions: { select: { audio_url: true, autorId: true } }
                    }
                }
            }
        });

        if (projeto) {
            const refs: AudioRef[] = [{ url: projeto.audio_guia, ownerId: projeto.userId }];

            for (const camada of projeto.camadas ?? []) {
                for (const version of camada.versions ?? []) {
                    refs.push({ url: version.audio_url, ownerId: version.autorId });
                }
                refs.push({ url: camada.audio_url, ownerId: camada.userId });
            }

            // Só apaga arquivos dentro do diretório de quem os enviou (bloqueia URLs forjadas/legadas).
            await deleteOwnedAudios(Fastify, refs);
        }

        await Fastify.prisma.projeto.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        return reply.status(202).send({
            status: "sucesso",
            mensagem: "Projeto deletado"
        });

    });
}

export { del_project };
