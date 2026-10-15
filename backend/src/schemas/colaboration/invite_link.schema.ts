import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const LinkInfo = Type.Object({
    id: Type.String({ format: 'uuid' }),
    token: Type.String(),
    cargo: Type.String(),
    max_usos: Type.Integer(),
    usos: Type.Integer(),
    expira_em: Type.String()
});

const criar_invite_link_schema = {
    schema: {
        tags: ['colaboração'],
        description: 'Cria um link de convite reutilizável para o projeto (apenas o dono)',
        security: [{ bearerAuth: [] }],
        params: Type.Object({ id: Type.String({ format: 'uuid' }) }),
        body: Type.Object({
            cargo: Type.Optional(Type.String({ minLength: 2, maxLength: 30 })),
            max_usos: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
            dias_validade: Type.Optional(Type.Integer({ minimum: 1, maximum: 30 }))
        }),
        response: {
            201: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                link: LinkInfo
            }),
            ...Error_schema
        }
    }
};

const listar_invite_links_schema = {
    schema: {
        tags: ['colaboração'],
        description: 'Lista os links de convite ativos do projeto (apenas o dono)',
        security: [{ bearerAuth: [] }],
        params: Type.Object({ id: Type.String({ format: 'uuid' }) }),
        response: {
            200: Type.Object({
                status: Type.String(),
                links: Type.Array(LinkInfo)
            }),
            ...Error_schema
        }
    }
};

const revogar_invite_link_schema = {
    schema: {
        tags: ['colaboração'],
        description: 'Revoga um link de convite (apenas o dono)',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' }),
            linkId: Type.String({ format: 'uuid' })
        }),
        response: {
            200: Type.Object({ status: Type.String(), mensagem: Type.String() }),
            ...Error_schema
        }
    }
};

const preview_invite_link_schema = {
    schema: {
        tags: ['colaboração'],
        description: 'Mostra a qual projeto um link de convite dá acesso',
        security: [{ bearerAuth: [] }],
        params: Type.Object({ token: Type.String({ minLength: 10, maxLength: 100 }) }),
        response: {
            200: Type.Object({
                status: Type.String(),
                projeto: Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    titulo: Type.String(),
                    genero: Type.String()
                }),
                cargo: Type.String(),
                convidado_por: Type.String(),
                expira_em: Type.String()
            }),
            ...Error_schema
        }
    }
};

const entrar_invite_link_schema = {
    schema: {
        tags: ['colaboração'],
        description: 'Entra no projeto usando um link de convite',
        security: [{ bearerAuth: [] }],
        params: Type.Object({ token: Type.String({ minLength: 10, maxLength: 100 }) }),
        response: {
            201: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                projetoId: Type.String()
            }),
            ...Error_schema
        }
    }
};

export {
    criar_invite_link_schema,
    listar_invite_links_schema,
    revogar_invite_link_schema,
    preview_invite_link_schema,
    entrar_invite_link_schema
};
