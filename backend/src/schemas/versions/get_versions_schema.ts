import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const VersionResponse = Type.Object({
    id: Type.String({ format: 'uuid' }),
    camadaId: Type.String({ format: 'uuid' }),
    audio_url: Type.String(),
    nome_trilha: Type.String(),
    instrumento_tag: Type.String(),
    delay_offset: Type.Number(),
    volume_padrao: Type.Number(),
    versionNumber: Type.Number(),
    mensagem: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String({ format: 'date-time' }),
    autor: Type.Object({
        id: Type.String({ format: 'uuid' }),
        nome_completo: Type.String(),
        avatar_url: Type.Union([Type.String(), Type.Null()])
    })
});

const get_versions_schema = {
    schema: {
        tags: ['versionamento'],
        description: 'Lista o histórico de versões de uma camada',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' })
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                versoes: Type.Array(VersionResponse)
            }),
            ...Error_schema
        }
    }
};

const get_version_detail_schema = {
    schema: {
        tags: ['versionamento'],
        description: 'Retorna os detalhes de uma versão específica',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            id: Type.String({ format: 'uuid' }),
            versionId: Type.String({ format: 'uuid' })
        }),
        response: {
            200: Type.Object({
                status: Type.String(),
                versao: VersionResponse
            }),
            ...Error_schema
        }
    }
};

export { get_versions_schema, get_version_detail_schema };
