import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_permissao } from "../../hooks/verificar_permissao.js";
import { get_schemaPROJETC } from "../../schemas/projetos/get_schemaPROJETC.js";

const Get_projects_user: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);
    Fastify.addHook("preHandler", verificar_permissao);

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
            projetos: projetos.map(({ id, titulo, genero, descricao, bpm, escala, createdAt }) => ({
                id,
                titulo,
                genero,
                descricao,
                bpm,
                escala,
                createdAt: createdAt.toISOString()
            }))
        });

    });
}

export { Get_projects_user };
