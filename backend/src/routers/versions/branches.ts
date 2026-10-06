import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_autor_ou_dono_layer } from '../../hooks/verificar_dono_layer.js';
import {
    create_branch_schema,
    list_branches_schema,
    switch_branch_schema,
    merge_branch_schema,
    delete_branch_schema
} from "../../schemas/versions/branch_schemas.js";
import {
    createBranch,
    listBranches,
    switchBranch,
    mergeBranch,
    deleteBranch
} from "../../services/branchService.js";

const branch_route: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);
    Fastify.addHook("preHandler", verificar_autor_ou_dono_layer);

    Fastify.post("/layer/:id/branches", create_branch_schema, async (request, reply) => {
        const { id } = request.params;
        const { nome, baseVersionId } = request.body;
        const userId = request.user.id;

        try {
            const branch = await createBranch(Fastify.prisma, {
                nome,
                camadaId: id,
                baseVersionId,
                userId
            });

            return reply.status(201).send({
                status: "sucesso",
                branch
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erro ao criar branch";
            return reply.status(400).send({
                status: "erro",
                mensagem: message
            });
        }
    });

    Fastify.get("/layer/:id/branches", list_branches_schema, async (request, reply) => {
        const { id } = request.params;

        try {
            const branches = await listBranches(Fastify.prisma, id);

            return reply.status(200).send({
                status: "sucesso",
                branches
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erro ao listar branches";
            return reply.status(400).send({
                status: "erro",
                mensagem: message
            });
        }
    });

    Fastify.patch("/layer/:id/switch-branch/:branchId", switch_branch_schema, async (request, reply) => {
        const { id, branchId } = request.params;
        const userId = request.user.id;

        try {
            const headVersion = await switchBranch(Fastify.prisma, {
                camadaId: id,
                branchId,
                userId
            });

            return reply.status(200).send({
                status: "sucesso",
                mensagem: "Branch trocada com sucesso",
                versao: {
                    id: headVersion.id,
                    versionNumber: headVersion.versionNumber,
                    createdAt: headVersion.createdAt.toISOString()
                }
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erro ao trocar branch";
            return reply.status(400).send({
                status: "erro",
                mensagem: message
            });
        }
    });

    Fastify.post("/layer/:id/branches/:branchId/merge", merge_branch_schema, async (request, reply) => {
        const { id, branchId } = request.params;
        const { mensagem } = request.body;
        const userId = request.user.id;

        try {
            const mergeVersion = await mergeBranch(Fastify.prisma, {
                camadaId: id,
                branchId,
                userId,
                mensagem
            });

            return reply.status(200).send({
                status: "sucesso",
                mensagem: "Merge realizado com sucesso",
                versao: {
                    id: mergeVersion.id,
                    versionNumber: mergeVersion.versionNumber,
                    createdAt: mergeVersion.createdAt.toISOString()
                }
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erro ao fazer merge";
            return reply.status(400).send({
                status: "erro",
                mensagem: message
            });
        }
    });

    Fastify.delete("/layer/:id/branches/:branchId", delete_branch_schema, async (request, reply) => {
        const { id, branchId } = request.params;
        const userId = request.user.id;

        try {
            await deleteBranch(Fastify.prisma, id, branchId, userId);

            return reply.status(200).send({
                status: "sucesso",
                mensagem: "Branch excluída com sucesso"
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erro ao excluir branch";
            return reply.status(400).send({
                status: "erro",
                mensagem: message
            });
        }
    });
};

export { branch_route };