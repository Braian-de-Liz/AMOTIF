import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const favorite_toggle_schema = {
    schema: {
        tags: ['favoritos'],
        description: 'Favorita ou desfavorita um projeto',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            projetoId: Type.String({ format: 'uuid' })
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                favoritado: Type.Boolean()
            }),
            ...Error_schema
        }
    }
};

const list_favorites_schema = {
    schema: {
        tags: ['favoritos'],
        description: 'Lista os projetos favoritados pelo usuário logado',
        security: [{ bearerAuth: [] }],
        response: {
            200: Type.Object({
                status: Type.String(),
                Favotitos: Type.Array(Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    titulo: Type.String(),
                    genero: Type.String(),
                    bpm: Type.Integer(),
                    escala: Type.Union([Type.String(), Type.Null()]),
                    descricao: Type.Union([Type.String(), Type.Null()]),
                    audio_guia: Type.String(),
                    createdAt: Type.String({ format: 'date-time' }),
                    autor: Type.Object({
                        nome_completo: Type.String(),
                        avatar_url: Type.Union([Type.String(), Type.Null()])
                    }),
                    _count: Type.Object({
                        camadas: Type.Integer(),
                        colaboradores: Type.Integer()
                    })
                })),
                total: Type.Integer()
            }),
            ...Error_schema
        }
    }
};

export { favorite_toggle_schema, list_favorites_schema };