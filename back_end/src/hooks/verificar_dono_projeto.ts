// back_end\src\hooks\verificar_dono_projeto.ts
import { FastifyReply, FastifyRequest } from "fastify";

async function verificar_dono_projeto(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const usuarioLogadoId = request.user.id;

    const projeto = await request.server.prisma.projeto.findUnique({
        where: { id },
        select: { userId: true }
    });

    if (!projeto) {
        return reply.status(404).send({ mensagem: "Projeto não encontrado." });
    }

    if (projeto.userId !== usuarioLogadoId) {
        return reply.status(403).send({
            mensagem: "Ação negada: Você não é o autor deste projeto."
        });
    }
}

export { verificar_dono_projeto };