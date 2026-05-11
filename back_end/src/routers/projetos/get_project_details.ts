import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { schema_details_project } from "../../schemas/projetos/get_one_project.js";

const Get_a_project: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("preValidation", autenticarJWT);

    Fastify.get("/projetos/:id", schema_details_project, async (request, reply) => {

        const { id } = request.params;

        const projeto = await Fastify.prisma.projeto.findUnique({
            where: { id },
            include: {
                autor: {
                    select: {
                        nome_completo: true,
                        avatar_url: true
                    }
                },
                camadas: {
                    include: {
                        autor: {
                            select: {
                                nome_completo: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });
        if (!projeto) {
            Fastify.log.error("projeto inexistente");

            return reply.status(404).send({
                status: 'erro',
                mensagem: 'projeto não encontrado ou não existente'
            });
        }

        return reply.status(200).send({
            status: 'sucesso',
            mensagem: 'projeto carregado',
            projeto
        })

    });
}

export { Get_a_project };