// back_end\src\hooks\verificar_dono_projeto.ts
import { FastifyReply, FastifyRequest } from "fastify";

/**
 * Cria um hook que exige que o usuário logado seja o dono do projeto cujo ID está em `params[paramName]`.
 * Ex.: verificar_dono_projeto()            -> lê params.id
 *      verificar_dono_projeto('projetoId') -> lê params.projetoId
 */
function verificar_dono_projeto(paramName: string = 'id') {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        const projetoId = (request.params as Record<string, string | undefined>)[paramName];
        const usuarioLogadoId = request.user.id;

        if (!projetoId) {
            return reply.status(400).send({
                status: "erro",
                mensagem: "ID do projeto não informado."
            });
        }

        const projeto = await request.server.prisma.projeto.findUnique({
            where: { id: projetoId },
            select: { userId: true, deletedAt: true }
        });

        if (!projeto || projeto.deletedAt) {
            return reply.status(404).send({
                status: "erro",
                mensagem: "Projeto não encontrado."
            });
        }

        if (projeto.userId !== usuarioLogadoId) {
            return reply.status(403).send({
                status: "erro",
                mensagem: "Ação negada: Você não é o autor deste projeto."
            });
        }
    };
}

export { verificar_dono_projeto };
