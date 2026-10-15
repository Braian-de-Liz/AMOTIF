import type { EncodeRequest, WorkerMessage } from './mp3Encoder.worker';
import type { ProgressCallback } from './mp3Core';

/**
 * Codifica um AudioBuffer em MP3 num Web Worker, sem travar a interface.
 * Os canais são copiados antes do envio para não invalidar o AudioBuffer de origem.
 */
function encodeMp3InWorker(audio: AudioBuffer, onProgress?: ProgressCallback): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL('./mp3Encoder.worker.ts', import.meta.url), { type: 'module' });

        const finish = () => worker.terminate();

        worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
            const msg = event.data;
            if (msg.type === 'progress') {
                onProgress?.(msg.fraction);
            } else if (msg.type === 'done') {
                finish();
                resolve(new Blob([msg.mp3 as BlobPart], { type: 'audio/mpeg' }));
            } else {
                finish();
                reject(new Error(`Falha ao gerar MP3: ${msg.message}`));
            }
        };

        worker.onerror = (event) => {
            finish();
            reject(new Error(`Falha ao gerar MP3: ${event.message || 'erro no worker'}`));
        };

        const channels = Array.from({ length: audio.numberOfChannels }, (_, c) => audio.getChannelData(c).slice());
        const request: EncodeRequest = { channels, sampleRate: audio.sampleRate };
        worker.postMessage(request, channels.map(ch => ch.buffer));
    });
}

export { encodeMp3InWorker };
