// back_end\src\hooks\verificar_permissao_layer.ts
import { FastifyReply, FastifyRequest } from "fastify";

async function verificar_permissao_layer(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const usuarioLogadoId = request.user.id;

    const layer = await request.server.prisma.camada.findUnique({
        where: { id },
        select: {
            userId: true,
            projeto: { select: { userId: true } }
        }
    });

    if (!layer) {
        return reply.status(404).send({
            mensagem: "Camada não encontrada."
        });
    }

    const eDonoDaCamada = usuarioLogadoId === layer.userId;
    const eDonoDoProjeto = usuarioLogadoId === layer.projeto.userId;

    if (!eDonoDaCamada && !eDonoDoProjeto) {

        return reply.status(403).send({
            mensagem: 'Usuário não autorizado para esta ação.'
        });
    }
}

export { verificar_permissao_layer }