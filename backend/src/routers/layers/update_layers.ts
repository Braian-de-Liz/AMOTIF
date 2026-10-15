import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_autor_layer } from "../../hooks/verificar_dono_layer.js";
import { update_layer_schema } from "../../schemas/layers/update_layer.schema.js";
import { createNewVersion } from "../../services/versionService.js";
import { isOwnedAudioUrl } from "../../lib/storage_path.js";

const update_layer: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);
    Fastify.addHook("preHandler", verificar_autor_layer);

    Fastify.put("/layer/:id", update_layer_schema, async (request, reply) => {
        const { id } = request.params;

        const { nome_trilha, audio_url, instrumento_tag, delay_offset, volume_padrao, bpm_original, transposicao_semitons, mensagem, tag } = request.body;
        const userId = request.user.id;

        const camadaAtual = await Fastify.prisma.camada.findUnique({
            where: { id },
            select: {
                audio_url: true,
                nome_trilha: true,
                instrumento_tag: true,
                delay_offset: true,
                volume_padrao: true,
                bpm_original: true,
                transposicao_semitons: true,
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

        // Campos opcionais ausentes mantêm o valor atual.
        const novo = {
            delay_offset: delay_offset ?? camadaAtual.delay_offset,
            volume_padrao: volume_padrao ?? camadaAtual.volume_padrao,
            bpm_original: bpm_original === undefined ? (camadaAtual.bpm_original ?? null) : bpm_original,
            transposicao_semitons: transposicao_semitons ?? camadaAtual.transposicao_semitons ?? 0
        };

        const dadosMudaram =
            audioMudou ||
            camadaAtual.nome_trilha !== nome_trilha ||
            camadaAtual.instrumento_tag !== instrumento_tag ||
            camadaAtual.delay_offset !== novo.delay_offset ||
            camadaAtual.volume_padrao !== novo.volume_padrao ||
            (camadaAtual.bpm_original ?? null) !== novo.bpm_original ||
            (camadaAtual.transposicao_semitons ?? 0) !== novo.transposicao_semitons;

        if (dadosMudaram) {
            try {
                await createNewVersion(Fastify.prisma, id, userId, {
                    audio_url,
                    nome_trilha,
                    instrumento_tag,
                    ...novo
                }, mensagem || `Atualização manual`, tag);
            } catch (err) {
                Fastify.log.error("Erro ao criar versão: " + err);
            }
        }

        await Fastify.prisma.camada.update({
            where: { id },
            data: {
                nome_trilha,
                audio_url,
                instrumento_tag,
                ...novo,
                // Trocar o áudio de uma camada aprovada exige nova aprovação do dono do projeto.
                // Mudar só BPM/tom não altera o arquivo, então a aprovação é mantida.
                ...(audioMudou && camadaAtual.esta_aprovada ? { esta_aprovada: false } : {})
            }
        });

        return reply.status(200).send({
            status: "sucesso",
            mensagem: "Camada atualizada com sucesso."
        });

    });

}

export { update_layer };
