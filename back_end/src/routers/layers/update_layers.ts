import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { update_layer_schema } from "../../schemas/layers/update_layer.schema.js";

const update_layer: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.put("/layer/:id", update_layer_schema, async (request, reply) => {
        const { id } = request.params;
        const { nome_trilha, audio_url, instrumento_tag, delay_offset, volume_padrao, esta_aprovada } = request.body;

        const layer = await Fastify.prisma.camada.update({
            where: {
                id: id
            },
            data: {
                nome_trilha: nome_trilha,
                audio_url: audio_url,
                instrumento_tag: instrumento_tag,
                delay_offset: delay_offset,
                volume_padrao: volume_padrao,
                esta_aprovada: esta_aprovada
            }
        });

        if (!layer) {
            return reply.status(404).send({
                status: "erro",
                mensagem: "Camada não encontrada."
            });
        }

        return reply.status(200).send({
            status: "sucesso",
            mensagem: "Camada atualizada com sucesso."
        });

    });

}

export { update_layer };
