import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { audioSigner } from "../../lib/signed_urls.js";
import { get_versions_schema, get_version_detail_schema } from "../../schemas/versions/get_versions_schema.js";

const get_versions: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.get("/layer/:id/versions", get_versions_schema, async (request, reply) => {
        const { id } = request.params;
        const { cursor, limit: rawLimit } = request.query as { cursor?: string; limit?: string };
        const limit = Math.min(Math.max(parseInt(rawLimit || '20', 10) || 20, 1), 100);

        const camada = await Fastify.prisma.camada.findUnique({
            where: { id },
            select: { id: true }
        });

        if (!camada) {
            return reply.status(404).send({
                status: "erro",
                mensagem: "Camada não encontrada"
            });
        }

        const versoes = await Fastify.prisma.layerVersion.findMany({
            where: {
                camadaId: id,
                ...(cursor ? { versionNumber: { lt: parseInt(cursor, 10) } } : {})
            },
            orderBy: { versionNumber: 'desc' },
            take: limit + 1,
            include: {
                autor: {
                    select: { id: true, nome_completo: true, avatar_url: true }
                }
            }
        });

        const hasMore = versoes.length > limit;
        const items = hasMore ? versoes.slice(0, limit) : versoes;
        const nextCursor = hasMore ? items[items.length - 1].versionNumber.toString() : null;

        const sign = await audioSigner(Fastify.storage, items.map(v => v.audio_url));

        return reply.status(200).send({
            status: "sucesso",
            versoes: items.map(v => ({
                id: v.id,
                camadaId: v.camadaId,
                audio_url: sign(v.audio_url),
                nome_trilha: v.nome_trilha,
                instrumento_tag: v.instrumento_tag,
                delay_offset: v.delay_offset,
                volume_padrao: v.volume_padrao,
                bpm_original: v.bpm_original,
                transposicao_semitons: v.transposicao_semitons,
                versionNumber: v.versionNumber,
                mensagem: v.mensagem,
                tag: v.tag,
                createdAt: v.createdAt.toISOString(),
                autor: v.autor
            })),
            nextCursor
        });
    });

    Fastify.get("/layer/:id/versions/:versionId", get_version_detail_schema, async (request, reply) => {
        const { id, versionId } = request.params;

        const versao = await Fastify.prisma.layerVersion.findFirst({
            where: { id: versionId, camadaId: id },
            include: {
                autor: {
                    select: { id: true, nome_completo: true, avatar_url: true }
                }
            }
        });

        if (!versao) {
            return reply.status(404).send({
                status: "erro",
                mensagem: "Versão não encontrada"
            });
        }

        const sign = await audioSigner(Fastify.storage, [versao.audio_url]);

        return reply.status(200).send({
            status: "sucesso",
            versao: {
                id: versao.id,
                camadaId: versao.camadaId,
                audio_url: sign(versao.audio_url),
                nome_trilha: versao.nome_trilha,
                instrumento_tag: versao.instrumento_tag,
                delay_offset: versao.delay_offset,
                volume_padrao: versao.volume_padrao,
                bpm_original: versao.bpm_original,
                transposicao_semitons: versao.transposicao_semitons,
                versionNumber: versao.versionNumber,
                mensagem: versao.mensagem,
                tag: versao.tag,
                createdAt: versao.createdAt.toISOString(),
                autor: versao.autor
            }
        });
    });
};

export { get_versions };
