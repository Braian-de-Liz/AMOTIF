import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { schema_layer } from "../../schemas/layers/create_schema_lyr.js";
import { createInitialVersion } from "../../services/versionService.js";
import { createMainBranchIfNotExists } from "../../services/branchService.js";
import { audioSigner } from "../../lib/signed_urls.js";
import { isOwnedAudioUrl, normalizeAudioUrl } from "../../lib/storage_path.js";
import { papelNoProjeto, pode } from "../../lib/permissoes.js";

const create_Layer: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.post("/layer/:projetoId", schema_layer, async (request, reply) => {
        const userId = request.user.id;
        const { projetoId } = request.params;
        const { nome_trilha, instrumento_tag, delay_offset, volume_padrao, bpm_original, transposicao_semitons, tag } = request.body;
        // Aceita também uma URL assinada devolvida pela API; no banco fica sempre a forma canônica.
        const audio_url = normalizeAudioUrl(request.body.audio_url);

        const check_project = await Fastify.prisma.projeto.findUnique({
            where: { id: projetoId },
            select: {
                userId: true,
                titulo: true,
                deletedAt: true
            }
        });

        if (!check_project || check_project.deletedAt) {
            Fastify.log.error("projeto não existente");

            return reply.status(404).send({
                status: "erro",
                mensagem: "projeto não existente"
            });
        }

        // Só dono, produtores e músicos do projeto enviam camadas; ouvintes e usuários de fora não.
        const papel = await papelNoProjeto(Fastify, { id: projetoId, userId: check_project.userId }, userId);
        if (!pode(papel, "enviarCamada")) {
            return reply.status(403).send({
                status: "erro",
                mensagem: papel === "OUVINTE"
                    ? "Ação negada: ouvintes não podem enviar camadas."
                    : "Ação negada: apenas colaboradores do projeto podem enviar camadas."
            });
        }

        // O áudio precisa ter sido enviado pelo próprio usuário (diretório `${userId}/` no Storage).
        if (!isOwnedAudioUrl(audio_url, userId)) {
            return reply.status(400).send({
                status: "erro",
                mensagem: "audio_url inválida: envie o arquivo pelo endpoint de upload."
            });
        }

        // Camada, versão inicial e branch main são gravadas juntas: se uma etapa falhar, nada fica órfão.
        const nova_camada = await Fastify.prisma.$transaction(async (tx) => {
            const camada = await tx.camada.create({
                data: {
                    nome_trilha,
                    audio_url,
                    instrumento_tag,
                    delay_offset,
                    volume_padrao,
                    bpm_original: bpm_original ?? null,
                    transposicao_semitons: transposicao_semitons ?? 0,
                    // Toda contribuição entra como pendente; só o dono do projeto aprova.
                    esta_aprovada: false,
                    projetoId,
                    userId
                }
            })

            await createInitialVersion(tx, camada.id, userId, {
                audio_url,
                nome_trilha,
                instrumento_tag,
                delay_offset: delay_offset ?? 0,
                volume_padrao: volume_padrao ?? 1.0,
                bpm_original: camada.bpm_original,
                transposicao_semitons: camada.transposicao_semitons
            }, tag);

            await createMainBranchIfNotExists(tx, camada.id, userId);

            return camada;
        });

        if (userId !== check_project.userId) {

            try {
                await Fastify.prisma.notification.create({
                    data: {
                        userId: check_project.userId,
                        actorId: userId,
                        projetoId: projetoId,
                        tipo: "NEW_LAYER",
                        mensagem: `${request.user.nome} adicionou uma nova trilha ao seu projeto "${check_project.titulo}"!`
                    }
                });
                Fastify.log.info(`Notificação enviada para o usuário ${check_project.userId}`);
            }

            catch (err) {
                Fastify.log.error("Falha ao gerar notificação de nova camada:" + err);
            }

        }

        const sign = await audioSigner(Fastify.storage, [nova_camada.audio_url]);

        return reply.status(201).send({
            status: "sucesso",
            mensagem: "Colaboração enviada com sucesso!",
            camada: {
                id: nova_camada.id,
                nome_trilha: nova_camada.nome_trilha,
                audio_url: sign(nova_camada.audio_url),
                instrumento_tag: nova_camada.instrumento_tag,
                delay_offset: nova_camada.delay_offset,
                volume_padrao: nova_camada.volume_padrao,
                bpm_original: nova_camada.bpm_original ?? null,
                transposicao_semitons: nova_camada.transposicao_semitons ?? 0,
                esta_aprovada: nova_camada.esta_aprovada,
                projetoId: nova_camada.projetoId,
                userId: nova_camada.userId,
                createdAt: nova_camada.createdAt.toISOString()
            }
        });
    });

}

export { create_Layer };
