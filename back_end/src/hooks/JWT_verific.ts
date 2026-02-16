import { FastifyReply, FastifyRequest } from 'fastify';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: string;
      nome: string;
      email: string; 
    }
  }
}

async function autenticarJWT(request: FastifyRequest, reply: FastifyReply) {
    try {
        await request.jwtVerify();
    } 
    catch (erro) {
        return reply.status(401).send({
            status: 'erro',
            mensagem: 'Não autorizado.'
        });
    }
}

export { autenticarJWT };