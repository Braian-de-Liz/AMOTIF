import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { schema_post_project } from "../../schemas/projetos/creat_project_schema.js";

const post_project: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.post("/projetos/:id", schema_post_project, async (request, reply) => {
        const { id } = request.params; 
        const { titulo, bpm, audio_guia, descricao, escala } = request.body;
        const userId = request.user.id; 

        try {
            const novo_projeto = await Fastify.prisma.projeto.create({
                data: {
                    titulo,
                    bpm,
                    audio_guia,
                    descricao,
                    escala,
                    userId: id 
                }
            });

            try {
                const seguidores = await Fastify.prisma.follows.findMany({
                    where: { followingId: id }, 
                    select: { followerId: true }
                });

                if (seguidores.length > 0) {
                    const notificationsData = seguidores.map(f => ({
                        userId: f.followerId,     
                        actorId: userId, 
                        projetoId: novo_projeto.id,
                        tipo: "PROJECT_RELEASED" as any, 
                        mensagem: `${request.user.nome} lançou um novo projeto: "${titulo}"! Que tal colaborar?`
                    }));

                    await Fastify.prisma.notification.createMany({
                        data: notificationsData
                    });

                    Fastify.log.info(`${notificationsData.length} seguidores notificados.`);
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