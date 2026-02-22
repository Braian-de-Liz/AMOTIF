import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { schema_bio } from "../../schemas/user_schema/bio_schema.js";


const Patch_bio: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.patch("/usuario_bio/:id", schema_bio, async (request, reply) => {

        const { id } = request.params;
        const { bio } = request.body

        if (request.user.id !== id) {
            return reply.status(403).send({
                status: "erro",
                mensagem: "Não tens permissão para editar este perfil."
            });
        }


        try {
            await Fastify.prisma.user.update({
                where: { id },
                data: { bio }
            });

            Fastify.log.info("bio do usuário alterada com sucesso")
            return reply.status(200).send({
                status: 'sucesso',
                mensagem: 'bio adicionada'
            });


        }
        catch (erro) {
            Fastify.log.warn("Erro interno no servidor " + erro);

            return reply.status(500).send({
                status: 'erro',
                mensagem: 'erro interno no servidor, tente mais tarde'
            });
        }

    });
}

export { Patch_bio };