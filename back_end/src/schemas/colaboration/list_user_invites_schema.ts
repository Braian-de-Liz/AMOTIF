import { Type } from '@sinclair/typebox';

const list_user_invites_schema = {
    schema: {
        tags: ['Convites'],
        description: 'Lista todos os convites pendentes recebidos pelo usuário logado',
        response: {
            200: {
                type: 'object',
                properties: {
                    status: Type.String(),
                    convites: Type.Array(Type.Object({
                        id: Type.String(),
                        projetoId: Type.String(),
                        projetoTitulo: Type.String(),
                        remetenteId: Type.String(),
                        remetenteNome: Type.String(),
                        cargo: Type.String(),
                        mensagem: Type.Union([Type.String(), Type.Null()]),
                        token_convite: Type.String(),
                        expira_em: Type.String()
                    }))
                }
            }
        }
    }
};

export { list_user_invites_schema };