import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { get_schemaPROJETC } from "../../schemas/projetos/get_schemaPROJETC.js";

const Get_projects_user: FastifyPluginAsyncZod = async (Fastify) => {
    Fastify.addHook("preValidation", autenticarJWT);

    Fastify.get("/projetos/:id/get", get_schemaPROJETC, async (request, reply) => {
        const { id } = request.params;

        const projetos = await Fastify.prisma.projeto.findMany({
            where: {
                userId: id
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (projetos.length === 0) {
            return reply.status(200).send({
                status: 'sucesso',
                mensagem: 'O usuário ainda não possui projetos.',
                projetos: []
            });
        }

        return reply.status(200).send({
            status: 'sucesso',
            mensagem: 'Projetos encontrados com sucesso.',
            projetos
        });

    });
}

export { Get_projects_user };