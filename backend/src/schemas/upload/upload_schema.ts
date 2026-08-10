import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const schema_upload_audio = {
    schema: {
        tags: ['upload'],
        description: 'Upload de arquivo de áudio para o Supabase Storage. Envie como multipart/form-data com campo "audio".',
        security: [{ bearerAuth: [] }],
        consumes: ['multipart/form-data'],
        response: {
            200: Type.Object({
                status: Type.String(),
                fileUrl: Type.String({ format: 'uri' }),
                path: Type.String()
            }),
            ...Error_schema
        }
    }
};

export { schema_upload_audio };
