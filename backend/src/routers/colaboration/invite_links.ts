import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { randomBytes } from "node:crypto";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_dono_projeto } from "../../hooks/verificar_dono_projeto.js";
import {
    criar_invite_link_schema,
    listar_invite_links_schema,
    revogar_invite_link_schema
} from "../../schemas/colaboration/invite_link.schema.js";

const DIA_MS = 24 * 60 * 60 * 1000;

const invite_links: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);
    Fastify.addHook("preHandler", verificar_dono_projeto());

    Fastify.post("/colaboration/:id/invite-link", criar_invite_link_schema, async (request, reply) => {
        const { id } = request.params;
        const { cargo = "membro", papel, max_usos = 10, dias_validade = 7 } = request.body;

        const link = await Fastify.prisma.conviteLink.create({
            data: {
                projetoId: id,
                criadoPorId: request.user.id,
                token: randomBytes(24).toString("base64url"),
                cargo,
                ...(papel && { papel }),
                max_usos,
                expira_em: new Date(Date.now() + dias_validade * DIA_MS)
            }
        });

        return reply.status(201).send({
            status: "sucesso",
            mensagem: "Link de convite criado com sucesso",
            link: {
                id: link.id,
                token: link.token,
                cargo: link.cargo,
                papel: link.papel,
                max_usos: link.max_usos,
                usos: link.usos,
                expira_em: link.expira_em.toISOString()
            }
        });
    });

    Fastify.get("/colaboration/:id/invite-links", listar_invite_links_schema, async (request, reply) => {
        const { id } = request.params;

        const links = await Fastify.prisma.conviteLink.findMany({
            where: { projetoId: id, revogadoEm: null, expira_em: { gt: new Date() } },
            orderBy: { createdAt: "desc" }
        });

        return reply.status(200).send({
            status: "sucesso",
            links: links
                .filter(l => l.usos < l.max_usos)
                .map(l => ({
                    id: l.id,
                    token: l.token,
                    cargo: l.cargo,
                    papel: l.papel,
                    max_usos: l.max_usos,
                    usos: l.usos,
                    expira_em: l.expira_em.toISOString()
                }))
        });
    });

    Fastify.delete("/colaboration/:id/invite-link/:linkId", revogar_invite_link_schema, async (request, reply) => {
        const { id, linkId } = request.params;

        const { count } = await Fastify.prisma.conviteLink.updateMany({
            where: { id: linkId, projetoId: id, revogadoEm: null },
            data: { revogadoEm: new Date() }
        });

        if (count === 0) {
            return reply.status(404).send({
                status: "erro",
                mensagem: "Link de convite não encontrado."
            });
        }

        return reply.status(200).send({
            status: "sucesso",
            mensagem: "Link de convite revogado."
        });
    });
};

export { invite_links };
