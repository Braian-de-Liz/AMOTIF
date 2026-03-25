import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { search_instrumento } from "../../schemas/search/search_by_instrument_schema.js";

const search_user_by_instruments: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.get("/search/user", search_instrumento, async (request, reply) => {

        const { instrumento, limite, pagina } = request.query;

        const take = limite || 20;
        const skip = ((pagina || 1) - 1) * take;

        try {

            const usuarios = await Fastify.prisma.user.findMany({
                where: {
                    instrumentos: {
                        has: instrumento
                    }
                },
                select: {
                    id: true,
                    nome_completo: true,
                    avatar_url: true,
                    instrumentos: true,
                    bio: true,
                    _count: {
                        select: {
                            seguidores: true,
                            projetos_criados: true
                        }
                    }
                },
                take,
                skip,
                orderBy: {
                    createdAt: 'desc'
                }
            });

            if (usuarios.length === 0) {
                return reply.status(404).send({
                    status: "erro",
                    mensagem: `Nenhum músico encontrado que toque ${instrumento}.`
                });
            }

            return reply.status(200).send({
                status: "sucesso",
                resultados: usuarios
            });


        }

        catch (erro) {
            Fastify.log.error(erro);

            return reply.status(500).send({
                status: "erro",
                mensagem: "Erro interno ao buscar músicos por instrumento."
            });
        }
    });

}

export { search_user_by_instruments };