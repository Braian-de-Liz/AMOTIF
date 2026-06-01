import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const list_user_invites_schema = {
    schema: {
        tags: ['Convites'],
        description: 'Lista todos os convites pendentes recebidos pelo usuário logado',
        response: {
            200: Type.Object({
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
            }),
            ...Error_schema
        }
    }
};

export { list_user_invites_schema };