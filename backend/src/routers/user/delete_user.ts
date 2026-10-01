import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_permissao } from "../../hooks/verificar_permissao.js";
import { Schema_del_user } from "../../schemas/user_schema/delete_user_schema.js";
import { deleteOwnedAudios, type AudioRef } from "../../lib/safe_delete.js";

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

        const refs: AudioRef[] = [];

        for (const projeto of projetos) {
            refs.push({ url: projeto.audio_guia, ownerId: projeto.userId });

            for (const camada of projeto.camadas ?? []) {
                for (const version of camada.versions ?? []) {
                    refs.push({ url: version.audio_url, ownerId: version.autorId });
                }
                refs.push({ url: camada.audio_url, ownerId: camada.userId });
            }
        }

        // Só apaga arquivos dentro do diretório de quem os enviou (bloqueia URLs forjadas/legadas).
        await deleteOwnedAudios(Fastify, refs);

        await Fastify.prisma.user.delete({ where: { id } });

        return reply.status(202).send({
            status: 'sucesso',
            mensagem: 'usuário deletado com sucesso'
        });
    });
}

export { Deletar_user };
