import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_permissao_layer } from "../../hooks/verificar_dono_layer.js";
import { delete_lay_schema } from "../../schemas/layers/delete_a_layer.js";


const delete_layer: FastifyPluginAsyncZod = async (Fastify) => {
    Fastify.addHook("preValidation", autenticarJWT);
    Fastify.addHook("preHandler", verificar_permissao_layer);

    Fastify.delete("/layer/:id", delete_lay_schema, async (request, reply) => {

        const { id } = request.params;

        await Fastify.prisma.camada.delete({ where: { id } });

        return reply.status(200).send({
            status: "sucesso",
            mensagem: "Camada removida"
        });
    });
};

export { delete_layer };
