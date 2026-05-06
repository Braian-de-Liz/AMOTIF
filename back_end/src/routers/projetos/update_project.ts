import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_dono_projeto } from "../../hooks/verificar_dono_projeto.js";
import { update_project_schema } from "../../schemas/projetos/update_project_schema.js";

const Update_project: FastifyPluginAsyncZod = async (Fastify) => {
    Fastify.addHook("preValidation", autenticarJWT);
    Fastify.addHook("preHandler", verificar_dono_projeto);
  
  Fastify.patch("/projetos/:id", update_project_schema, async (request, reply) => {
      const { id } = request.params;
      const dadosAtualizados = request.body;

      const projeto = await Fastify.prisma.projeto.update({
        where: { id },
        data: dadosAtualizados,
      });

      return reply.status(200).send({
        status: "sucesso",
        mensagem: "projeto atualizado com sucesso",
        projeto,
      });
    },
  );
};

export { Update_project };
