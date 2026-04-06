import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { schema_layer } from "../../schemas/layers/create_schema_lyr.js";

const create_Layer: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.post("/layer/:projetoId", schema_layer, async (request, reply) => {
        const userId = request.user.id;
        const { projetoId } = request.params;
        const { nome_trilha, audio_url, instrumento_tag, delay_offset, volume_padrao } = request.body;

        const check_project = await Fastify.prisma.projeto.findUnique({ where: { id: projetoId } });

        if (!check_project) {
            Fastify.log.error("projeto não existente");

            return reply.status(404).send({
                status: "erro",
                mensagem: "projeto não existente"
            });
        }

        const nova_camada = await Fastify.prisma.camada.create({
            data: {
                nome_trilha,
                audio_url,
                instrumento_tag,
                delay_offset,
                volume_padrao,
                projetoId,
                userId
            }
        })

        if (userId !== check_project.userId) {

            try {
                await Fastify.prisma.notification.create({
                    data: {
                        userId: check_project.userId,
                        actorId: userId,
                        projetoId: projetoId,
                        tipo: "NEW_LAYER",
                        mensagem: `${request.user.nome} adicionou uma nova trilha ao seu projeto "${check_project.titulo}"!`
                    }
                });
                Fastify.log.info(`Notificação enviada para o usuário ${check_project.userId}`);
            }

            catch (err) {
                Fastify.log.error("Falha ao gerar notificação de nova camada:" + err);
            }
            
        }

        return reply.status(201).send({
            status: "sucesso",
            mensagem: "Colaboração enviada com sucesso!",
            camada: nova_camada
        });
    });

}

export { create_Layer };
