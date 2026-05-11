import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_permissao } from "../../hooks/verificar_permissao.js";
import { instrumentos_schema } from "../../schemas/user_schema/instrumentos_schema.js";

const Patch_Instrumentos: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("preValidation", autenticarJWT);
    Fastify.addHook("preHandler", verificar_permissao)

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