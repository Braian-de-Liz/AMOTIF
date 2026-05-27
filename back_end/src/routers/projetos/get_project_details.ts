import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { schema_details_project } from "../../schemas/projetos/get_one_project.js";

const Get_a_project: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

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
            projeto: {
                id: projeto.id,
                titulo: projeto.titulo,
                bpm: projeto.bpm,
                audio_guia: projeto.audio_guia,
                descricao: projeto.descricao,
                escala: projeto.escala,
                createdAt: projeto.createdAt.toISOString(),
                autor: projeto.autor,
                camadas: projeto.camadas.map(({ id, nome_trilha, audio_url, instrumento_tag, volume_padrao, delay_offset, esta_aprovada, createdAt, autor }) => ({
                    id,
                    nome_trilha,
                    audio_url,
                    instrumento_tag,
                    volume_padrao,
                    delay_offset,
                    esta_aprovada,
                    createdAt: createdAt.toISOString(),
                    autor
                }))
            }
        })

    });
}

export { Get_a_project };
