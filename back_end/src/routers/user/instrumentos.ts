import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { instrumentos_schema } from "../../schemas/user_schema/instrumentos_schema.js";

const Patch_Users: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.patch("/usuario/:id/instrumentos", instrumentos_schema, async (request, reply) => {

        const { id } = request.params;
        const { instrumentos } = request.body;

        try {
            const insert_instrumento = await Fastify.prisma.user.update({ where: { id }, data: { instrumentos } });


        }

        catch (erro) {

        }

    });

}

export { Patch_Users };