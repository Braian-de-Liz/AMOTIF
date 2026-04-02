import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { schema_post_project } from "../../schemas/projetos/creat_project_schema.js";

const post_project: FastifyPluginAsyncZod = async (Fastify) => {


    Fastify.post("/projetos", schema_post_project, async (request, reply) => {
        const userId = request.user.id;
        const { titulo, genero, bpm, audio_guia, descricao, escala } = request.body;

        try {
            const novo_projeto = await Fastify.prisma.projeto.create({
                data: {
                    titulo,
                    genero,
                    bpm,
                    audio_guia,
                    descricao,
                    escala,
                    userId: userId
                }
            });

            try {
                const seguidores = await Fastify.prisma.follows.findMany({
                    where: { followingId: userId },
                    select: { followerId: true }
                });

                if (seguidores.length > 0) {
                    const notificationsData = seguidores.map(f => ({
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

            return reply.status(201).send({
                status: "sucesso",
                mensagem: "Projeto criado com sucesso!",
                projeto: novo_projeto
            });

        } catch (erro) {
            Fastify.log.error(erro);
            return reply.status(500).send({
                status: "erro",
                mensagem: "Erro ao criar projeto no banco de dados."
            });
        }
    });
};

export { post_project };