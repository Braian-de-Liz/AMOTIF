import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { schema_colaboretors } from "../../schemas/projetos/colaboretors_schema.js";


const colaborators: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.get("/projects/:id/collaborators", schema_colaboretors, async (request, reply) => {

        const { id } = request.params;

        try {
            const cooll = await Fastify.prisma.projeto.findUnique({
                where: { id },
                select: {
                    colaboradores: {
                        select: {
                            cargo: true,
                            joinedAt: true,
                            usuario: {
                                select: {
                                    id: true,
                                    nome_completo: true,
                                    avatar_url: true,
                                    instrumentos: true,
                                    email: true
                                }
                            }
                        }
                    }
                }
            })
        }
        catch (erro) {

        }

    });

}

export { colaborators };