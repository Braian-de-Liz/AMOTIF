import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { schema_colaboretors } from "../../schemas/colaboration/colaboretors_schema.js";

const colaborators: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("preValidation", autenticarJWT);

    Fastify.get("/colaboration/:id", schema_colaboretors, async (request, reply) => {

        const { id } = request.params;

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

    });

}

export { colaborators };