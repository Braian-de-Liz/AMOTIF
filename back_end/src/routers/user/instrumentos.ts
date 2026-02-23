import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { instrumentos_schema } from "../../schemas/user_schema/instrumentos_schema.js";

const Patch_Instrumentos: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.patch("/usuario/:id/instrumentos", instrumentos_schema, async (request, reply) => {

        const { id } = request.params;
        const { instrumentos } = request.body;

        if (request.user.id !== id) {
            return reply.status(403).send({
                status: "erro",
                mensagem: "Não tens permissão para editar este perfil."
            });
        }

        try {

            await Fastify.prisma.user.update({ where: { id }, data: { instrumentos } });

            return reply.status(200).send({
                status: "sucesso",
                mensagem: "Instrumentos atualizados!"
            });

        }

        catch (erro) {

            Fastify.log.warn("erro interno ao adicionar instrumento a lista " + erro);

            return reply.status(500).send({
                status: 'erro',
                mensagem: 'erro interno ao adicionar instrumento a lista'
            });

        }

    });

}

export { Patch_Instrumentos };