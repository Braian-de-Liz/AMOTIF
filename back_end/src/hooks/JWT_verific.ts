import { FastifyReply, FastifyRequest } from 'fastify';

async function autenticarJWT(request: FastifyRequest, reply: FastifyReply) {
    
    try {
        await request.jwtVerify();
    }
    catch (erro) {
        request.log.warn(`Tentativa de acesso não autorizado: ${erro}`);

        return reply.status(401).send({
            status: 'erro',
            mensagem: 'Não autorizado. Token inválido ou ausente.'
        });
    }
}

export { autenticarJWT };