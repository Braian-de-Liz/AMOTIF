import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { Deletar_Colab_schema } from "../../schemas/colaboration/delete_colab_schema.js";

const Delete_Colab: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.delete("/colaboration/:projetoId/remove/:userId", Deletar_Colab_schema, async (request, reply) => {

        const { projetoId, userId } = request.params;

        

    });

}

export { Delete_Colab };