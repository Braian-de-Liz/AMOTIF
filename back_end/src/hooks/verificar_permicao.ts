// back_end\src\hooks\verificar_permissao.ts
import { FastifyReply, FastifyRequest } from "fastify";
import "@fastify/jwt";

declare module "fastify" {
  interface FastifyRequest {
    user: {
      id: string;
      nome: string;
      email: string;
    }
  }
}

async function verificar_permissao(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { id } = request.params as { id: string };

        const usuarioLogadoId = request.user.id;

        if (id !== usuarioLogadoId) {
            return reply.status(403).send({
                status: 'erro',
                mensagem: 'Ação negada: Você não tem permissão para acessar ou alterar dados de outro usuário.'
            });
        }
        
    } catch (error) {
        return reply.status(500).send({
            status: 'erro',
            mensagem: 'Erro interno ao verificar permissões.'
        });
    }
}

export { verificar_permissao };