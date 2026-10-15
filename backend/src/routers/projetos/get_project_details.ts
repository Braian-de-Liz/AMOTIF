import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { schema_details_project } from "../../schemas/projetos/get_one_project.js";
import { audioSigner } from "../../lib/signed_urls.js";
import { papelNoProjeto } from "../../lib/permissoes.js";

const Get_a_project: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.get("/projetos/:id", schema_details_project, async (request, reply) => {

        const { id } = request.params;

        const projeto = await Fastify.prisma.projeto.findUnique({
            where: { id },
            select: {
                id: true,
                titulo: true,
                bpm: true,
                audio_guia: true,
                descricao: true,
                escala: true,
                status: true,
                createdAt: true,
                deletedAt: true,
                autor: {
                    select: {
                        id: true,
                        nome_completo: true,
                        avatar_url: true
                    }
                },
                camadas: {
                    where: { deletedAt: null },
                    select: {
                        id: true,
                        nome_trilha: true,
                        audio_url: true,
                        instrumento_tag: true,
                        volume_padrao: true,
                        delay_offset: true,
                        bpm_original: true,
                        transposicao_semitons: true,
                        esta_aprovada: true,
                        createdAt: true,
                        autor: {
                            select: {
                                id: true,
                                nome_completo: true
                            }
                        },
                        currentVersion: {
                            select: {
                                id: true,
                                versionNumber: true,
                                mensagem: true,
                                createdAt: true
                            }
                        },
                        _count: {
                            select: {
                                versions: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });
        if (!projeto || projeto.deletedAt) {
            Fastify.log.error("projeto inexistente");

            return reply.status(404).send({
                status: 'erro',
                mensagem: 'projeto não encontrado ou não existente'
            });
        }

        const meu_papel = await papelNoProjeto(Fastify, { id: projeto.id, userId: projeto.autor.id }, request.user.id);

        const sign = await audioSigner(Fastify.storage, [
            projeto.audio_guia,
            ...projeto.camadas.map(c => c.audio_url)
        ]);

        return reply.status(200).send({
            status: 'sucesso',
            mensagem: 'projeto carregado',
            projeto: {
                id: projeto.id,
                titulo: projeto.titulo,
                bpm: projeto.bpm,
                audio_guia: sign(projeto.audio_guia),
                descricao: projeto.descricao,
                escala: projeto.escala,
                status: projeto.status,
                meu_papel,
                createdAt: projeto.createdAt.toISOString(),
                autor: projeto.autor,
                camadas: projeto.camadas.map(({ id, nome_trilha, audio_url, instrumento_tag, volume_padrao, delay_offset, bpm_original, transposicao_semitons, esta_aprovada, createdAt, autor, currentVersion, _count }) => ({
                    id,
                    nome_trilha,
                    audio_url: sign(audio_url),
                    instrumento_tag,
                    volume_padrao,
                    delay_offset,
                    bpm_original,
                    transposicao_semitons,
                    esta_aprovada,
                    createdAt: createdAt.toISOString(),
                    autor,
                    versaoAtual: currentVersion ? {
                        id: currentVersion.id,
                        numero: currentVersion.versionNumber,
                        mensagem: currentVersion.mensagem,
                        criadaEm: currentVersion.createdAt.toISOString()
                    } : null,
                    totalVersoes: _count.versions
                }))
            }
        })

    });
}

export { Get_a_project };
