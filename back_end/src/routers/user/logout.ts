import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

const logout_user: FastifyPluginAsyncTypebox = async (Fastify) => {

    Fastify.post("/usuario/logout", async (request, reply) => {

        reply.clearCookie('token', { path: '/' });

        return reply.status(200).send({
            status: "sucesso",
            mensagem: "Logout realizado com sucesso"
        });
        
    });
}

export { logout_user };