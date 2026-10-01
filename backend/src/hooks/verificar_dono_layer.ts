// back_end\src\hooks\verificar_dono_layer.ts
// Hooks de autorização para ações sobre uma camada (layer) identificada por `params.id`.
//
// - verificar_autor_layer:          somente o autor da camada (editar).
// - verificar_autor_ou_dono_layer:  autor da camada ou dono do projeto (deletar, rollback).
//
// Ambos retornam 404 se a camada não existir, estiver soft-deletada ou pertencer a um projeto soft-deletado.
import { FastifyReply, FastifyRequest } from "fastify";

async function carregarCamada(request: FastifyRequest) {
    const { id } = request.params as { id: string };

    const layer = await request.server.prisma.camada.findUnique({
        where: { id },
        select: {
            userId: true,
            deletedAt: true,
            projeto: {
                select: {
                    userId: true,
                    deletedAt: true
                }
            }
        }
    });

    if (!layer || layer.deletedAt || !layer.projeto || layer.projeto.deletedAt) {
        return null;
    }

    return layer;
}

function naoEncontrada(reply: FastifyReply) {
    return reply.status(404).send({
        status: "erro",
        mensagem: "Camada não encontrada."
    });
}

async function verificar_autor_layer(request: FastifyRequest, reply: FastifyReply) {
    const layer = await carregarCamada(request);
    if (!layer) return naoEncontrada(reply);

    if (layer.userId !== request.user.id) {
        return reply.status(403).send({
            status: "erro",
            mensagem: "Ação negada: apenas o autor da camada pode editá-la."
        });
    }
}

async function verificar_autor_ou_dono_layer(request: FastifyRequest, reply: FastifyReply) {
    const layer = await carregarCamada(request);
    if (!layer) return naoEncontrada(reply);

    const usuarioLogadoId = request.user.id;

    if (layer.userId !== usuarioLogadoId && layer.projeto.userId !== usuarioLogadoId) {
        return reply.status(403).send({
            status: "erro",
            mensagem: "Ação negada: apenas o autor da camada ou o dono do projeto podem realizar esta ação."
        });
    }
}

export { verificar_autor_layer, verificar_autor_ou_dono_layer };
