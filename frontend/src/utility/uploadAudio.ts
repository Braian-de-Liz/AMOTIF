import { URL_API_TESTE } from './url_apis';

/** Mesmo limite do backend (MAX_FILE_SIZE em backend/src/lib/upload.ts). */
const MAX_UPLOAD_BYTES = 40 * 1024 * 1024;

class UploadTooLargeError extends Error {
    constructor(public readonly size: number) {
        super(uploadTooLargeMessage(size));
        this.name = 'UploadTooLargeError';
    }
}

function formatMB(bytes: number): string {
    return (bytes / (1024 * 1024)).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

function uploadTooLargeMessage(size: number): string {
    return `Arquivo muito grande: ${formatMB(size)}MB. O máximo permitido é ${formatMB(MAX_UPLOAD_BYTES)}MB.`;
}

/** Retorna a mensagem de erro se o arquivo passar do limite, ou null se couber. */
function checkUploadSize(blob: Blob): string | null {
    return blob.size > MAX_UPLOAD_BYTES ? uploadTooLargeMessage(blob.size) : null;
}

/** Lança UploadTooLargeError se o arquivo passar do limite. */
function assertUploadSize(blob: Blob): void {
    if (blob.size > MAX_UPLOAD_BYTES) throw new UploadTooLargeError(blob.size);
}

/**
 * Envia o áudio para POST /upload e devolve a URL pública.
 * Arquivos acima do limite são recusados aqui, sem nenhuma requisição.
 */
async function uploadAudioFile(file: File): Promise<string> {
    assertUploadSize(file);

    const uploadData = new FormData();
    uploadData.append('audio', file);

    const uploadRes = await fetch(`${URL_API_TESTE}/upload`, {
        method: 'POST',
        credentials: 'include',
        body: uploadData,
    });

    if (!uploadRes.ok) {
        const errBody = await uploadRes.json().catch(() => ({}));
        if (uploadRes.status === 413) {
            throw new Error(errBody.mensagem || uploadTooLargeMessage(file.size));
        }
        throw new Error(errBody.mensagem || 'Falha ao enviar áudio.');
    }

    const { fileUrl } = await uploadRes.json();
    return fileUrl as string;
}

export { MAX_UPLOAD_BYTES, UploadTooLargeError, checkUploadSize, assertUploadSize, uploadAudioFile };
