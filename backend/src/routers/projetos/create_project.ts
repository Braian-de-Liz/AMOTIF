import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { schema_post_project } from "../../schemas/projetos/creat_project_schema.js";
import { isOwnedAudioUrl, normalizeAudioUrl } from "../../lib/storage_path.js";
import { audioSigner } from "../../lib/signed_urls.js";

const post_project: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.post("/projetos", schema_post_project, async (request, reply) => {
        const userId = request.user.id;
        const { titulo, genero, bpm, descricao, escala, audio_metadata } = request.body;
        // Aceita também uma URL assinada devolvida pela API; no banco fica sempre a forma canônica.
        const audio_guia = normalizeAudioUrl(request.body.audio_guia);

        // O áudio guia precisa ter sido enviado pelo próprio usuário (diretório `${userId}/` no Storage).
        if (!isOwnedAudioUrl(audio_guia, userId)) {
            return reply.status(400).send({
                status: "erro",
                mensagem: "audio_guia inválido: envie o arquivo pelo endpoint de upload."
            });
        }

        const novo_projeto = await Fastify.prisma.projeto.create({
            data: {
                titulo,
                genero,
                bpm,
                audio_guia,
                audio_metadata: audio_metadata ?? undefined,
                descricao,
                escala,
                userId: userId
            }
        });

        void (async () => {
            try {
                const seguidores = await Fastify.prisma.follows.findMany({
                    where: { followingId: userId },
                    select: { followerId: true }
                });

                if (seguidores.length > 0) {
                    const notificationsData = seguidores.map((f) => ({
                        userId: f.followerId,
                        actorId: userId,
                        projetoId: novo_projeto.id,
                        tipo: Fastify.notiType.PROJECT_RELEASED,
                        mensagem: `${request.user.nome} lançou um novo projeto de ${genero}: "${titulo}"!`
                    }));

                    await Fastify.prisma.notification.createMany({
                        data: notificationsData
                    });
                }
            } catch (notifErr) {
                Fastify.log.error("Falha ao notificar seguidores: " + notifErr);
            }
        })();

        const sign = await audioSigner(Fastify.storage, [novo_projeto.audio_guia]);

        return reply.status(201).send({
            status: "sucesso",
            mensagem: "Projeto criado com sucesso!",
            projeto: {
                id: novo_projeto.id,
                titulo: novo_projeto.titulo,
                genero: novo_projeto.genero,
                bpm: novo_projeto.bpm,
                escala: novo_projeto.escala,
                descricao: novo_projeto.descricao,
                audio_guia: sign(novo_projeto.audio_guia),
                userId: novo_projeto.userId,
                createdAt: novo_projeto.createdAt.toISOString(),
                updatedAt: novo_projeto.updatedAt.toISOString()
            }
        });

    });
};

export { post_project };
