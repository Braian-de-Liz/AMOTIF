import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { schema_post_project } from "../../schemas/projetos/creat_project_schema.js";

const post_project: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.post("/projetos/:id", schema_post_project, async (request, reply) => {

        const { id } = request.params;
        const { titulo, bpm, audio_guia, descricao, escala } = request.body;


        try {

            const novo_projeto = await Fastify.prisma.projeto.create({
                data: {
                    titulo,
                    bpm,
                    audio_guia,
                    descricao,
                    escala,
                    userId: id
                }
             });

             return reply.status(201).send({
                status: "sucesso",
                mensagem: "Projeto criado com sucesso!",
                projeto: novo_projeto
            });

        }
        catch (erro) {
            Fastify.log.error(erro);
            return reply.status(500).send({
                status: "erro",
                mensagem: "Erro ao criar projeto no banco de dados."
            });
        }

    });
}

export { post_project };