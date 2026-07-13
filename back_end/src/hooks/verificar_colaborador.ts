import { FastifyReply, FastifyRequest } from "fastify";

async function verificar_colaborador(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const usuarioLogadoId = request.user.id;

    const projeto = await request.server.prisma.projeto.findUnique({
        where: { id },
        select: { userId: true, deletedAt: true }
    });

    if (!projeto || projeto.deletedAt) {
        return reply.status(404).send({
            status: "erro",
            mensagem: "Projeto não encontrado."
        });
    }

    if (projeto.userId === usuarioLogadoId) {
        return;
    }

    const colaborador = await request.server.prisma.colaborador.findUnique({
        where: {
            userId_projetoId: {
                userId: usuarioLogadoId,
                projetoId: id
            }
        },
        select: { id: true }
    });

    if (!colaborador) {
        return reply.status(403).send({
            status: "erro",
            mensagem: "Ação negada: Você não é colaborador deste projeto."
        });
    }
}

export { verificar_colaborador };
