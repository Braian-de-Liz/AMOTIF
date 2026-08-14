import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { get_versions_schema, get_version_detail_schema } from "../../schemas/versions/get_versions_schema.js";

const get_versions: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.get("/layer/:id/versions", get_versions_schema, async (request, reply) => {
        const { id } = request.params;

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
            where: { camadaId: id },
            orderBy: { versionNumber: 'desc' },
            take: 100,
            include: {
                autor: {
                    select: { id: true, nome_completo: true, avatar_url: true }
                }
            }
        });

        return reply.status(200).send({
            status: "sucesso",
            versoes: versoes.map(v => ({
                id: v.id,
                camadaId: v.camadaId,
                audio_url: v.audio_url,
                nome_trilha: v.nome_trilha,
                instrumento_tag: v.instrumento_tag,
                delay_offset: v.delay_offset,
                volume_padrao: v.volume_padrao,
                versionNumber: v.versionNumber,
                mensagem: v.mensagem,
                createdAt: v.createdAt.toISOString(),
                autor: v.autor
            }))
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

        return reply.status(200).send({
            status: "sucesso",
            versao: {
                id: versao.id,
                camadaId: versao.camadaId,
                audio_url: versao.audio_url,
                nome_trilha: versao.nome_trilha,
                instrumento_tag: versao.instrumento_tag,
                delay_offset: versao.delay_offset,
                volume_padrao: versao.volume_padrao,
                versionNumber: versao.versionNumber,
                mensagem: versao.mensagem,
                createdAt: versao.createdAt.toISOString(),
                autor: versao.autor
            }
        });
    });
};

export { get_versions };
