import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_dono_projeto } from "../../hooks/verificar_dono_projeto.js";
import { update_project_schema } from "../../schemas/projetos/update_project_schema.js";
import { isOwnedAudioUrl, normalizeAudioUrl } from "../../lib/storage_path.js";

const Update_project: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);
    Fastify.addHook("preHandler", verificar_dono_projeto());

    Fastify.patch("/projetos/:id", update_project_schema, async (request, reply) => {
        const { id } = request.params;
        const { titulo, descricao, genero, status, bpm, escala } = request.body;

        // Troca do áudio guia: o arquivo novo precisa ter sido enviado por quem está editando (o dono).
        const audio_guia = request.body.audio_guia === undefined ? undefined : normalizeAudioUrl(request.body.audio_guia);
        if (audio_guia !== undefined && !isOwnedAudioUrl(audio_guia, request.user.id)) {
            return reply.status(400).send({
                status: "erro",
                mensagem: "audio_guia inválido: envie o arquivo pelo endpoint de upload."
            });
        }

        const dadosAtualizados: Record<string, unknown> = {};
        if (titulo !== undefined) dadosAtualizados.titulo = titulo;
        if (descricao !== undefined) dadosAtualizados.descricao = descricao;
        if (genero !== undefined) dadosAtualizados.genero = genero;
        if (status !== undefined) dadosAtualizados.status = status;
        if (bpm !== undefined) dadosAtualizados.bpm = bpm;
        if (escala !== undefined) dadosAtualizados.escala = escala;
        if (audio_guia !== undefined) dadosAtualizados.audio_guia = audio_guia;

        const projeto = await Fastify.prisma.projeto.update({
            where: { id },
            data: dadosAtualizados,
            select: {
                id: true,
                titulo: true,
                genero: true,
                status: true,
                bpm: true,
                descricao: true,
                escala: true,
                updatedAt: true,
            }
        });

        return reply.status(200).send({
            status: "sucesso",
            mensagem: "projeto atualizado com sucesso",
            projeto: {
                ...projeto,
                updatedAt: projeto.updatedAt.toISOString()
            },
        });
    });
};

export { Update_project };
