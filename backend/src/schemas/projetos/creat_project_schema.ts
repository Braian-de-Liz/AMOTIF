import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';
import { GeneroEnum } from './genero.enum.js';

const schema_post_project = {
    schema: {
        tags: ['projeto'],
        description: 'Cria um novo projeto musical',
        security: [{ bearerAuth: [] }],
        body: Type.Object({
            titulo: Type.String({ minLength: 2 }),
            genero: GeneroEnum,
            bpm: Type.Number({ minimum: 40, maximum: 300 }),
            escala: Type.Optional(Type.String()),
            descricao: Type.Optional(Type.String()),
            audio_guia: Type.String({ format: 'uri' }),
            audio_metadata: Type.Optional(Type.Object({
                nome: Type.String(),
                tamanhoMB: Type.Number(),
                duracaoSegundos: Type.Number(),
                codec: Type.String(),
                sampleRate: Type.Number()
            }))
        }),
        response: {
            201: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                projeto: Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    titulo: Type.String(),
                    genero: Type.String(),
                    bpm: Type.Number(),
                    escala: Type.Union([Type.String(), Type.Null()]),
                    descricao: Type.Union([Type.String(), Type.Null()]),
                    audio_guia: Type.String(),
                    userId: Type.String(),
                    createdAt: Type.String({ format: 'date-time' }),
                    updatedAt: Type.String({ format: 'date-time' })
                })
            }),
            ...Error_schema
        }
    }
}

export { schema_post_project };