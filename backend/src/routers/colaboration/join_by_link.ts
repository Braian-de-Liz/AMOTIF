import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Prisma } from "@prisma/client";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import {
    preview_invite_link_schema,
    entrar_invite_link_schema
} from "../../schemas/colaboration/invite_link.schema.js";

class LinkEsgotadoError extends Error { }
class JaColaboradorError extends Error { }

const join_by_link: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    async function buscarLinkValido(token: string) {
        const link = await Fastify.prisma.conviteLink.findUnique({
            where: { token },
            include: {
                projeto: { select: { id: true, titulo: true, genero: true, userId: true, deletedAt: true } },
                criadoPor: { select: { nome_completo: true } }
            }
        });

        if (!link || link.revogadoEm || link.projeto.deletedAt) {
            return { erro: { codigo: 404 as const, mensagem: "Link de convite não encontrado." } };
        }
        if (link.expira_em <= new Date() || link.usos >= link.max_usos) {
            return { erro: { codigo: 410 as const, mensagem: "Este link de convite expirou ou atingiu o limite de usos." } };
        }
        return { link };
    }

    Fastify.get("/invite-link/:token", preview_invite_link_schema, async (request, reply) => {
        const { link, erro } = await buscarLinkValido(request.params.token);
        if (!link) {
            return reply.status(erro!.codigo).send({ status: "erro", mensagem: erro!.mensagem });
        }

        return reply.status(200).send({
            status: "sucesso",
            projeto: { id: link.projeto.id, titulo: link.projeto.titulo, genero: link.projeto.genero },
            cargo: link.cargo,
            convidado_por: link.criadoPor.nome_completo,
            expira_em: link.expira_em.toISOString()
        });
    });

    Fastify.post("/invite-link/:token", entrar_invite_link_schema, async (request, reply) => {
        const userId = request.user.id;
        const { link, erro } = await buscarLinkValido(request.params.token);
        if (!link) {
            return reply.status(erro!.codigo).send({ status: "erro", mensagem: erro!.mensagem });
        }

        if (link.projeto.userId === userId) {
            return reply.status(409).send({ status: "erro", mensagem: "Você é o dono deste projeto." });
        }

        try {
            await Fastify.prisma.$transaction(async (tx) => {
                const jaColaborador = await tx.colaborador.findUnique({
                    where: { userId_projetoId: { userId, projetoId: link.projetoId } }
                });
                if (jaColaborador) throw new JaColaboradorError();

                // O incremento condicional garante que dois acessos simultâneos não passem do limite.
                const { count } = await tx.conviteLink.updateMany({
                    where: {
                        id: link.id,
                        revogadoEm: null,
                        expira_em: { gt: new Date() },
                        usos: { lt: link.max_usos }
                    },
                    data: { usos: { increment: 1 } }
                });
                if (count === 0) throw new LinkEsgotadoError();

                await tx.colaborador.create({
                    data: { userId, projetoId: link.projetoId, cargo: link.cargo, papel: link.papel }
                });
            });
        } catch (err) {
            // P2002: clique duplo — outra requisição do mesmo usuário criou o colaborador primeiro.
            const duplicado = err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
            if (err instanceof JaColaboradorError || duplicado) {
                return reply.status(409).send({ status: "erro", mensagem: "Você já é colaborador deste projeto." });
            }
            if (err instanceof LinkEsgotadoError) {
                return reply.status(410).send({
                    status: "erro",
                    mensagem: "Este link de convite expirou ou atingiu o limite de usos."
                });
            }
            throw err;
        }

        return reply.status(201).send({
            status: "sucesso",
            mensagem: "Bem-vindo ao projeto!",
            projetoId: link.projetoId
        });
    });
};

export { join_by_link };
