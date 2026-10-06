import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { schema_layer } from "../../schemas/layers/create_schema_lyr.js";
import { createInitialVersion } from "../../services/versionService.js";
import { createMainBranchIfNotExists } from "../../services/branchService.js";
import { isOwnedAudioUrl } from "../../lib/storage_path.js";

const create_Layer: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.post("/layer/:projetoId", schema_layer, async (request, reply) => {
        const userId = request.user.id;
        const { projetoId } = request.params;
        const { nome_trilha, audio_url, instrumento_tag, delay_offset, volume_padrao, tag } = request.body;

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

        // O áudio precisa ter sido enviado pelo próprio usuário (diretório `${userId}/` no Storage).
        if (!isOwnedAudioUrl(audio_url, userId)) {
            return reply.status(400).send({
                status: "erro",
                mensagem: "audio_url inválida: envie o arquivo pelo endpoint de upload."
            });
        }

        const nova_camada = await Fastify.prisma.camada.create({
            data: {
                nome_trilha,
                audio_url,
                instrumento_tag,
                delay_offset,
                volume_padrao,
                // Toda contribuição entra como pendente; só o dono do projeto aprova.
                esta_aprovada: false,
                projetoId,
                userId
            }
        })

        // Cria a versão inicial (lança erro se falhar)
        await createInitialVersion(Fastify.prisma, nova_camada.id, userId, {
            audio_url,
            nome_trilha,
            instrumento_tag,
            delay_offset: delay_offset ?? 0,
            volume_padrao: volume_padrao ?? 1.0
        }, tag);

        // Cria a branch main automaticamente
        await createMainBranchIfNotExists(Fastify.prisma, nova_camada.id, userId);

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

        return reply.status(201).send({
            status: "sucesso",
            mensagem: "Colaboração enviada com sucesso!",
            camada: {
                id: nova_camada.id,
                nome_trilha: nova_camada.nome_trilha,
                audio_url: nova_camada.audio_url,
                instrumento_tag: nova_camada.instrumento_tag,
                delay_offset: nova_camada.delay_offset,
                volume_padrao: nova_camada.volume_padrao,
                esta_aprovada: nova_camada.esta_aprovada,
                projetoId: nova_camada.projetoId,
                userId: nova_camada.userId,
                createdAt: nova_camada.createdAt.toISOString()
            }
        });
    });

}

export { create_Layer };
