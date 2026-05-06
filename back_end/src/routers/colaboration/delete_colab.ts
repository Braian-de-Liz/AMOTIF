import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { Deletar_Colab_schema } from "../../schemas/colaboration/delete_colab_schema.js";
import { verificar_dono_projeto } from "../../hooks/verificar_dono_projeto.js";

const Delete_Colab: FastifyPluginAsyncZod = async (Fastify) => {
    Fastify.addHook("preValidation", autenticarJWT);
    Fastify.addHook("preHandler", verificar_dono_projeto);

    Fastify.delete("/colaboration/:projetoId/remove/:userId", Deletar_Colab_schema, async (request, reply) => {

        const { projetoId, userId } = request.params;
        const usuarioLogadoId = request.user.id;

        const colaboracao = await Fastify.prisma.colaborador.findFirst({
            where: {
                projetoId: projetoId,
                userId: userId
            }
        });

        if (!colaboracao) {
            return reply.status(404).send({
                status: "erro",
                mensagem: "Colaborador não encontrado neste projeto."
            });
        }

        await Fastify.prisma.colaborador.delete({
            where: {
                id: colaboracao.id
            }
        });

        if (usuarioLogadoId !== userId) {

            await Fastify.prisma.notification.create({
                data: {
                    userId: userId,
                    actorId: usuarioLogadoId,
                    tipo: "PROJECT_REJECT",
                    mensagem: `Você foi removido de um projeto.`
                }
            }).catch(() => { });

        }

        return reply.status(200).send({
            status: "sucesso",
            mensagem: "Colaborador removido com sucesso."
        });

    });

}

export { Delete_Colab };
