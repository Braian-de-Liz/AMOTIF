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
    const token = request.cookies?.token;

    if (!token) {
        return reply.status(401).send({
            status: "erro",
            mensagem: "Token de autenticação não fornecido"
        });
    }

    try {
        const decoded = request.server.jwt.verify<{ id: string; nome: string; email: string }>(token);
        request.user = decoded;
    }
    catch {
        return reply.status(401).send({
            status: "erro",
            mensagem: "Token de autenticação inválido ou expirado"
        });
    }
}

export { autenticarJWT };
