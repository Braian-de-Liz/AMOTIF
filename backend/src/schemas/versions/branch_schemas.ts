import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const BranchVersionResponse = Type.Object({
    id: Type.String({ format: 'uuid' }),
    versionNumber: Type.Number(),
    createdAt: Type.String({ format: 'date-time' })
});

const BranchAuthorResponse = Type.Object({
    id: Type.String({ format: 'uuid' }),
    nome_completo: Type.String(),
    avatar_url: Type.Union([Type.String(), Type.Null()])
});

const BranchResponse = Type.Object({
    id: Type.String({ format: 'uuid' }),
    nome: Type.String(),
    camadaId: Type.String({ format: 'uuid' }),
    isMain: Type.Boolean(),
    baseVersion: BranchVersionResponse,
    headVersion: BranchVersionResponse,
    createdBy: BranchAuthorResponse,
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' })
});

const create_branch_schema = {
    schema: {
        tags: ['versionamento'],
        description: 'Cria uma nova branch a partir de uma versão existente',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' })
        }),
        body: Type.Object({
            nome: Type.String({ minLength: 1, maxLength: 50 }),
            baseVersionId: Type.String({ format: 'uuid' })
        }),
        response: {
            201: Type.Object({
                status: Type.String(),
                branch: BranchResponse
            }),
            ...Error_schema
        }
    }
};

const list_branches_schema = {
    schema: {
        tags: ['versionamento'],
        description: 'Lista todas as branches de uma camada',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' })
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                branches: Type.Array(BranchResponse)
            }),
            ...Error_schema
        }
    }
};

const switch_branch_schema = {
    schema: {
        tags: ['versionamento'],
        description: 'Troca a branch ativa da camada',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' }),
            branchId: Type.String({ format: 'uuid' })
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                versao: Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    versionNumber: Type.Number(),
                    createdAt: Type.String({ format: 'date-time' })
                })
            }),
            ...Error_schema
        }
    }
};

const merge_branch_schema = {
    schema: {
        tags: ['versionamento'],
        description: 'Faz merge de uma branch para a branch principal',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' }),
            branchId: Type.String({ format: 'uuid' })
        }),
        body: Type.Object({
            mensagem: Type.Optional(Type.String({ maxLength: 200 }))
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                versao: Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    versionNumber: Type.Number(),
                    createdAt: Type.String({ format: 'date-time' })
                })
            }),
            ...Error_schema
        }
    }
};

const delete_branch_schema = {
    schema: {
        tags: ['versionamento'],
        description: 'Exclui uma branch (exceto a principal)',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' }),
            branchId: Type.String({ format: 'uuid' })
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                mensagem: Type.String()
            }),
            ...Error_schema
        }
    }
};

export {
    create_branch_schema,
    list_branches_schema,
    switch_branch_schema,
    merge_branch_schema,
    delete_branch_schema
};