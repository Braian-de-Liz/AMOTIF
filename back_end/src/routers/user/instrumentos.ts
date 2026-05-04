import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { instrumentos_schema } from "../../schemas/user_schema/instrumentos_schema.js";

const Patch_Instrumentos: FastifyPluginAsyncZod = async (Fastify) => {
    Fastify.addHook("preValidation", autenticarJWT);

    Fastify.patch("/usuario/:id/instrumentos", instrumentos_schema, async (request, reply) => {

        const { id } = request.params;
        const { instrumentos } = request.body;

        if (request.user.id !== id) {
            return reply.status(403).send({
                status: "erro",
                mensagem: "Não tens permissão para editar este perfil."
            });
        }

        await Fastify.prisma.user.update({ where: { id }, data: { instrumentos } });

        return reply.status(200).send({
            status: "sucesso",
            mensagem: "Instrumentos atualizados!"
        });

    });
}

export { Patch_Instrumentos };
