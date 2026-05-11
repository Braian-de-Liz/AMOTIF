import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { search_project_schema } from "../../schemas/search/search_project.schema.js";

const search_project: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("preValidation", autenticarJWT);

    Fastify.get("/search/projects", search_project_schema, async (request, reply) => {

        const { query, escala, bpm_min, bpm_max, genero } = request.query;

        const projetos = await Fastify.prisma.projeto.findMany({
            where: {
                AND: [
                    query ? {
                        OR: [
                            { titulo: { contains: query, mode: 'insensitive' } },
                            { descricao: { contains: query, mode: 'insensitive' } }
                        ]
                    } : {},

                    genero ? { genero: genero } : {},

                    escala ? { escala: { equals: escala, mode: 'insensitive' } } : {},

                    {
                        bpm: {
                            gte: bpm_min || 0,
                            lte: bpm_max || 999
                        }
                    }
                ]
            },
            include: {
                autor: {
                    select: {
                        nome_completo: true,
                        avatar_url: true
                    }
                },
                _count: {
                    select: {
                        camadas: true,
                        colaboradores: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 30
        });

        return reply.status(200).send({
            status: "sucesso",
            resultados: projetos
        });

    });
}

export { search_project };