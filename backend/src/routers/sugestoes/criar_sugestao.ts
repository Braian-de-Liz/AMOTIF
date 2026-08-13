import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { criar_sugestao_schema } from "../../schemas/sugestoes/criar_sugestao.schema.js";

const criar_sugestao: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.post("/projetos/:id/sugestoes", criar_sugestao_schema, async (request, reply) => {
        const autorId = request.user.id;
        const { id: projetoId } = request.params;
        const { titulo, descricao } = request.body;

        const projeto = await Fastify.prisma.projeto.findUnique({
            where: { id: projetoId }
        });

        if (!projeto) {
            return reply.status(404).send({
                status: "error",
                mensagem: "Projeto não encontrado"
            });
        }

        const sugestao = await Fastify.prisma.sugestao.create({
            data: {
                titulo,
                descricao,
                projetoId,
                autorId
            },
            include: {
                autor: {
                    select: {
                        id: true,
                        nome_completo: true,
                        avatar_url: true
                    }
                }
            }
        });

        return reply.status(201).send({
            status: "success",
            mensagem: "Sugestão criada com sucesso",
            sugestao: {
                id: sugestao.id,
                titulo: sugestao.titulo,
                descricao: sugestao.descricao,
                status: sugestao.status,
                autor: sugestao.autor,
                criado_em: sugestao.createdAt.toISOString()
            }
        });
    });
};

export { criar_sugestao };
