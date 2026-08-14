import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_dono_projeto } from "../../hooks/verificar_dono_projeto.js";
import { Schema_del_project } from "../../schemas/projetos/del_project.schema.js";
import { extractPathFromUrl } from "../../lib/upload.js";

const del_project: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);
    Fastify.addHook("preHandler", verificar_dono_projeto);

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
            select: { audio_guia: true }
        });

        if (projeto?.audio_guia) {
            const path = extractPathFromUrl(projeto.audio_guia);
            if (path) {
                await Fastify.storage.deleteAudio(path);
            }
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
