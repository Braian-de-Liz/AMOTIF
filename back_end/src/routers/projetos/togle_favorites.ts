import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { favorite_toggle_schema } from "../../schemas/projetos/favorites.schema.js";
import { autenticarJWT } from "../../hooks/JWT_verific.js";


const Toggle_favorite: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("preValidation", autenticarJWT);

    Fastify.post("/projetos/favoritos/:projetoId", favorite_toggle_schema, async (request, reply) => {
        const { projetoId } = request.params;
        const userId = request.user.id;

        const existing = await Fastify.prisma.favorite.findUnique({
            where: { userId_projetoId: { userId, projetoId } }
        });

        if (existing) {
            await Fastify.prisma.favorite.delete({
                where: { id: existing.id }
            });

            return reply.status(200).send({
                status: "sucesso",
                favoritado: false
            })
        }


        const projeto = await Fastify.prisma.projeto.findUnique({
            where: { id: projetoId }
        });

        if (!projeto) {
            Fastify.log.error("projeto não encontrado, 404");

            return reply.status(404).send({
                status: 'erro',
                mensagem: 'Projeto não encontrado.'
            });
        }

        await Fastify.prisma.favorite.create({
            data: { userId, projetoId }
        });

        return reply.status(200).send({
            status: 'sucesso',
            favoritado: true
        });
    });
}

export { Toggle_favorite };