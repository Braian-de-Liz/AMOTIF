import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { autenticarJWT } from "../hooks/JWT_verific.js";
import type { MultipartFile } from "@fastify/multipart";
import { safeExtractPath, isSafePath } from "./storage_path.js";

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

// Extensões permitidas no path gravado no Storage. Nunca usar o filename do cliente diretamente.
const ALLOWED_EXTENSIONS = new Set([".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a"]);

const EXTENSION_BY_MIME: Record<string, string> = {
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
    "audio/ogg": ".ogg",
    "audio/flac": ".flac",
    "audio/aac": ".aac",
    "audio/mp4": ".m4a",
    "audio/x-m4a": ".m4a",
};

/** Extensão segura: usa a do filename se estiver na whitelist, senão deriva do mimetype, senão ".mp3". */
function resolveSafeExtension(filename: string | undefined, mimetype: string): string {
    const match = /\.([A-Za-z0-9]{1,5})$/.exec(filename ?? "");
    const fromName = match ? `.${match[1].toLowerCase()}` : null;

    if (fromName && ALLOWED_EXTENSIONS.has(fromName)) return fromName;

    return EXTENSION_BY_MIME[mimetype] ?? ".mp3";
}

interface UploadResult {
    fileUrl: string;
    path: string;
}

interface SupabaseStorage {
    uploadAudio: (userId: string, file: MultipartFile) => Promise<UploadResult>;
    deleteAudio: (path: string) => Promise<void>;
}

/** Extrai o path de uma URL pública do Storage; null se host/bucket não conferem ou houver traversal. */
function extractPathFromUrl(url: string): string | null {
    return safeExtractPath(url);
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

            if (file.file.truncated) {
                throw new UploadError(413, "Arquivo muito grande. Máximo 40MB");
            }

            const ext = resolveSafeExtension(file.filename, contentType);

            const fileId = crypto.randomUUID();
            const path = `${userId}/${fileId}${ext}`;

            const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${supabaseKey}`,
                    "apikey": supabaseKey,
                    "Content-Type": contentType,
                    "duplex": "half",
                    "x-upsert": "true",
                },
                body: file.file as unknown as ReadableStream,
            });

            if (!uploadResponse.ok) {
                const errBody = await uploadResponse.text();
                Fastify.log.error(`Supabase upload error (${uploadResponse.status}): ${errBody}`);
                throw new UploadError(500, "Erro ao fazer upload do arquivo");
            }

            const fileUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;

            return { fileUrl, path };
        },

        async deleteAudio(path: string): Promise<void> {
            // Defesa em profundidade: nunca enviar ao Supabase um path com traversal/encoding.
            if (!isSafePath(path)) {
                Fastify.log.warn(`deleteAudio: path inseguro recusado (${JSON.stringify(path)})`);
                throw new UploadError(400, "Caminho de arquivo inválido");
            }

            const deleteResponse = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${supabaseKey}`,
                    "apikey": supabaseKey,
                },
            });

            if (!deleteResponse.ok) {
                const errBody = await deleteResponse.text();
                Fastify.log.error(`Supabase delete error (${deleteResponse.status}): ${errBody}`);
                throw new UploadError(500, "Erro ao deletar arquivo do Supabase");
            }
        }
    };

    Fastify.decorate("storage", storage);
});

export { Upload_Service, UploadError, ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE, extractPathFromUrl, resolveSafeExtension };
