import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { schema_colaboretors } from "../../schemas/colaboration/colaboretors_schema.js";


const colaborators: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.get("/colaboration/:id", schema_colaboretors, async (request, reply) => {

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
            });


            if (!cooll) {
                Fastify.log.warn("Projeto não encontrado");

                return reply.status(404).send({
                    status: "erro",
                    mensagem: "Projeto não encontrado"
                });
            }

            return reply.status(200).send({
                status: 'sucesso',
                mensagem: 'colaboradores do projeto encontrados',
                colaborators: cooll
            })

        }
        catch (erro) {
            Fastify.log.error(erro);

            return reply.status(500).send({
                status : 'erro',
                mensagem : 'erro interno do servidot'
            })
        }

    });

}

export { colaborators };