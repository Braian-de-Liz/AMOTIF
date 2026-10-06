import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_autor_ou_dono_layer } from '../../hooks/verificar_dono_layer.js';
import { Type } from '@sinclair/typebox';
import { Error_schema } from '../../schemas/error/erro_schema.js';
import { createManualVersion, updateVersionTag } from "../../services/versionService.js";

const create_version_schema = {
    schema: {
        tags: ['versionamento'],
        description: 'Cria uma nova versão manual (commit) do estado atual da camada',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' })
        }),
        body: Type.Object({
            mensagem: Type.Optional(Type.String({ maxLength: 500 })),
            tag: Type.Optional(Type.String({ maxLength: 50 }))
        }),
        response: {
            201: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                versao: Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    versionNumber: Type.Number(),
                    mensagem: Type.Union([Type.String(), Type.Null()]),
                    tag: Type.Union([Type.String(), Type.Null()]),
                    createdAt: Type.String({ format: 'date-time' })
                })
            }),
            ...Error_schema
        }
    }
};

const update_version_tag_schema = {
    schema: {
        tags: ['versionamento'],
        description: 'Atualiza a tag semântica de uma versão existente',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' }),
            versionId: Type.String({ format: 'uuid' })
        }),
        body: Type.Object({
            tag: Type.Union([Type.String({ maxLength: 50 }), Type.Null()])
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                versao: Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    versionNumber: Type.Number(),
                    tag: Type.Union([Type.String(), Type.Null()])
                })
            }),
            ...Error_schema
        }
    }
};

const version_commit_route: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);
    Fastify.addHook("preHandler", verificar_autor_ou_dono_layer);

    Fastify.post("/layer/:id/versions", create_version_schema, async (request, reply) => {
        const { id } = request.params;
        const { mensagem, tag } = request.body;
        const userId = request.user.id;

        try {
            const versao = await createManualVersion(Fastify.prisma, id, userId, { mensagem, tag });

            return reply.status(201).send({
                status: "sucesso",
                mensagem: `Versão ${versao.versionNumber} criada com sucesso`,
                versao: {
                    id: versao.id,
                    versionNumber: versao.versionNumber,
                    mensagem: versao.mensagem,
                    tag: versao.tag,
                    createdAt: versao.createdAt.toISOString()
                }
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erro ao criar versão";
            return reply.status(400).send({
                status: "erro",
                mensagem: message
            });
        }
    });

    Fastify.patch("/layer/:id/versions/:versionId/tag", update_version_tag_schema, async (request, reply) => {
        const { id, versionId } = request.params;
        const { tag } = request.body;

        try {
            const versao = await updateVersionTag(Fastify.prisma, id, versionId, tag);

            return reply.status(200).send({
                status: "sucesso",
                mensagem: tag ? `Tag "${tag}" adicionada à versão ${versao.versionNumber}` : `Tag removida da versão ${versao.versionNumber}`,
                versao: {
                    id: versao.id,
                    versionNumber: versao.versionNumber,
                    tag: versao.tag
                }
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erro ao atualizar tag";
            return reply.status(400).send({
                status: "erro",
                mensagem: message
            });
        }
    });
};

export { version_commit_route };