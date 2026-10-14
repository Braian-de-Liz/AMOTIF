import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_autor_layer } from "../../hooks/verificar_dono_layer.js";
import { update_layer_schema } from "../../schemas/layers/update_layer.schema.js";
import { createNewVersion } from "../../services/versionService.js";
import { isOwnedAudioUrl, normalizeAudioUrl } from "../../lib/storage_path.js";

const update_layer: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);
    Fastify.addHook("preHandler", verificar_autor_layer);

    Fastify.put("/layer/:id", update_layer_schema, async (request, reply) => {
        const { id } = request.params;

        const { nome_trilha, instrumento_tag, delay_offset, volume_padrao, tag } = request.body;
        // Se o cliente devolver a URL assinada que recebeu, ela vale como a URL canônica do banco.
        const audio_url = normalizeAudioUrl(request.body.audio_url);
        const userId = request.user.id;

        const camadaAtual = await Fastify.prisma.camada.findUnique({
            where: { id },
            select: {
                audio_url: true,
                nome_trilha: true,
                instrumento_tag: true,
                delay_offset: true,
                volume_padrao: true,
                esta_aprovada: true
            }
        });

        if (!camadaAtual) {
            return reply.status(404).send({
                status: "erro",
                mensagem: "Camada não encontrada."
            });
        }

        const audioMudou = camadaAtual.audio_url !== audio_url;

        if (audioMudou && !isOwnedAudioUrl(audio_url, userId)) {
            return reply.status(400).send({
                status: "erro",
                mensagem: "audio_url inválida: envie o arquivo pelo endpoint de upload."
            });
        }

        const dadosMudaram =
            audioMudou ||
            camadaAtual.nome_trilha !== nome_trilha ||
            camadaAtual.instrumento_tag !== instrumento_tag ||
            camadaAtual.delay_offset !== delay_offset ||
            camadaAtual.volume_padrao !== volume_padrao;

        // Versão e atualização da camada são gravadas juntas: ou as duas, ou nenhuma.
        await Fastify.prisma.$transaction(async (tx) => {
            if (dadosMudaram) {
                await createNewVersion(tx, id, userId, {
                    audio_url,
                    nome_trilha,
                    instrumento_tag,
                    delay_offset: delay_offset ?? 0,
                    volume_padrao: volume_padrao ?? 1.0
                }, `Atualização manual`, tag);
            }

            await tx.camada.update({
                where: { id },
                data: {
                    nome_trilha,
                    audio_url,
                    instrumento_tag,
                    delay_offset,
                    volume_padrao,
                    // Trocar o áudio de uma camada aprovada exige nova aprovação do dono do projeto.
                    ...(audioMudou && camadaAtual.esta_aprovada ? { esta_aprovada: false } : {})
                }
            });
        });

        return reply.status(200).send({
            status: "sucesso",
            mensagem: "Camada atualizada com sucesso."
        });

    });

}

export { update_layer };
