import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_permissao_layer } from "../../hooks/verificar_dono_layer.js";
import { update_layer_schema } from "../../schemas/layers/update_layer.schema.js";
import { createNewVersion } from "../../services/versionService.js";

const update_layer: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);
    Fastify.addHook("preHandler", verificar_permissao_layer);

    Fastify.put("/layer/:id", update_layer_schema, async (request, reply) => {
        const { id } = request.params;
        const { nome_trilha, audio_url, instrumento_tag, delay_offset, volume_padrao, esta_aprovada } = request.body;
        const userId = request.user.id;

        const camadaAtual = await Fastify.prisma.camada.findUnique({
            where: { id },
            select: {
                audio_url: true,
                nome_trilha: true,
                instrumento_tag: true,
                delay_offset: true,
                volume_padrao: true
            }
        });

        if (!camadaAtual) {
            return reply.status(404).send({
                status: "erro",
                mensagem: "Camada não encontrada."
            });
        }

        const dadosMudaram =
            camadaAtual.audio_url !== audio_url ||
            camadaAtual.nome_trilha !== nome_trilha ||
            camadaAtual.instrumento_tag !== instrumento_tag ||
            camadaAtual.delay_offset !== delay_offset ||
            camadaAtual.volume_padrao !== volume_padrao;

        if (dadosMudaram) {
            try {
                await createNewVersion(Fastify.prisma, id, userId, {
                    audio_url,
                    nome_trilha,
                    instrumento_tag,
                    delay_offset: delay_offset ?? 0,
                    volume_padrao: volume_padrao ?? 1.0
                }, `Atualização manual`);
            } catch (err) {
                Fastify.log.error("Erro ao criar versão: " + err);
            }
        }

        const layer = await Fastify.prisma.camada.update({
            where: { id },
            data: {
                nome_trilha,
                audio_url,
                instrumento_tag,
                delay_offset,
                volume_padrao,
                esta_aprovada
            }
        });

        return reply.status(200).send({
            status: "sucesso",
            mensagem: "Camada atualizada com sucesso."
        });

    });

}

export { update_layer };
