import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_permissao } from "../../hooks/verificar_permissao.js";
import { schema_bio } from "../../schemas/user_schema/bio_schema.js";

const Patch_bio: FastifyPluginAsyncZod = async (Fastify) => {
    Fastify.addHook("preValidation", autenticarJWT);
    Fastify.addHook("preHandler", verificar_permissao);

    Fastify.patch("/usuario_bio/:id", schema_bio, async (request, reply) => {

        const { id } = request.params;
        const { bio } = request.body

        await Fastify.prisma.user.update({
            where: { id },
            data: { bio }
        });

        Fastify.log.info("bio do usuário alterada com sucesso")
        return reply.status(200).send({
            status: 'sucesso',
            mensagem: 'bio adicionada'
        });

    });
}

export { Patch_bio };
