import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import type { MultipartFile } from "@fastify/multipart";

const ALLOWED_CONTENT_TYPES: Record<string, boolean> = {
    "audio/mpeg": true,
    "audio/wav": true,
    "audio/x-wav": true,
    "audio/ogg": true,
    "audio/flac": true,
    "audio/aac": true,
    "audio/mp4": true,
    "audio/x-m4a": true,
};

const MAX_FILE_SIZE = 40 * 1024 * 1024;

interface UploadResult {
    fileUrl: string;
    path: string;
}

interface SupabaseStorage {
    uploadAudio: (userId: string, file: MultipartFile) => Promise<UploadResult>;
}

declare module "fastify" {
    interface FastifyInstance {
        storage: SupabaseStorage;
    }
}

class UploadError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message);
        this.name = "UploadError";
    }
}

const Upload_Service: FastifyPluginAsync = fp(async (Fastify) => {
    const supabaseUrl = Bun.env.SUPABASE_URL;
    const supabaseKey = Bun.env.SUPABASE_KEY;
    const bucket = Bun.env.SUPABASE_BUCKET || "audios-projetos";

    if (!supabaseUrl || !supabaseKey) {
        Fastify.log.error("SUPABASE_URL e SUPABASE_KEY são obrigatórios no .env");
        throw new Error("Variáveis de ambiente do Supabase não configuradas");
    }

    const storage: SupabaseStorage = {
        async uploadAudio(userId: string, file: MultipartFile): Promise<UploadResult> {
            const contentType = file.mimetype;

            if (!ALLOWED_CONTENT_TYPES[contentType]) {
                throw new UploadError(415, "Tipo de arquivo não permitido. Use: MP3, WAV, OGG, FLAC, AAC");
            }

            const buffer = await file.toBuffer();

            if (buffer.length === 0) {
                throw new UploadError(413, "Arquivo vazio");
            }

            if (buffer.length > MAX_FILE_SIZE) {
                throw new UploadError(413, "Arquivo muito grande. Máximo 40MB");
            }

            const ext = file.filename.includes(".")
                ? "." + file.filename.split(".").pop()
                : ".mp3";
            const timestamp = Date.now();
            const path = `${userId}/${timestamp}${ext}`;

            const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${supabaseKey}`,
                    "apikey": supabaseKey,
                    "Content-Type": contentType,
                },
                body: new Uint8Array(buffer),
            });

            if (!uploadResponse.ok) {
                const errBody = await uploadResponse.text();
                Fastify.log.error(`Supabase upload error (${uploadResponse.status}): ${errBody}`);
                throw new UploadError(500, "Erro ao fazer upload do arquivo");
            }

            const fileUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;

            return { fileUrl, path };
        }
    };

    Fastify.decorate("storage", storage);
});

export { Upload_Service, UploadError, ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE };
