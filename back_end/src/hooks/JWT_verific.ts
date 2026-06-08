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
    await request.jwtVerify();
}

export { autenticarJWT };