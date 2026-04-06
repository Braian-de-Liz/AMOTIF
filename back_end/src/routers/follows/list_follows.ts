import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { list_follows_schema } from "../../schemas/follows/list_follows.schema.js";

const list_follows: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.get("/follows", list_follows_schema, async (request, reply) => {
        const UserId = request.user.id;

        try {

            const follows = await Fastify.prisma.follows.findMany({
                where: {
                    usuario_id: UserId
                }
            });

            return reply.status(200).send({
                status: "sucesso",
                mensagem: "Follows listados com sucesso",
                follows: follows.length
            });

        }

        catch (erro) {
            Fastify.log.error("Erro ao listar follows: " + erro);

            return reply.status(500).send({
                status: "erro",
                mensagem: "Erro interno no servidor ao listar follows"
            });
        }
    });

}
export { list_follows };