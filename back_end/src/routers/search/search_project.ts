import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { search_project_schema } from "../../schemas/search/search_project.schema.js";

const search_project: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.get("/search/projects", search_project_schema, async (request, reply) => {
        
        const { query, escala, bpm_min, bpm_max } = request.query;

        try {
            const projetos = await Fastify.prisma.projeto.findMany({
                where: {
                    AND: [
                        query ? {
                            OR: [
                                { titulo: { contains: query, mode: 'insensitive' } },
                                { descricao: { contains: query, mode: 'insensitive' } }
                            ]
                        } : {},
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
                        select: { nome_completo: true, avatar_url: true }
                    },
                    _count: {
                        select: { camadas: true, colaboradores: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 30
            });

            return reply.status(200).send({
                status: "sucesso",
                resultados: projetos
            });

        } 
        catch (error) {
            Fastify.log.error(error);
            return reply.status(500).send({
                status: "erro",
                mensagem: "Erro ao realizar busca de projetos."
            });
        }

    });

}

export { search_project };