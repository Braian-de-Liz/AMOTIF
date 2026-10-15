/// <reference lib="webworker" />
import { encodeMp3 } from './mp3Core';

interface EncodeRequest {
    channels: Float32Array[]
    sampleRate: number
}

type WorkerMessage =
    | { type: 'progress'; fraction: number }
    | { type: 'done'; mp3: Uint8Array }
    | { type: 'error'; message: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = async (event: MessageEvent<EncodeRequest>) => {
    const { channels, sampleRate } = event.data;
    const post = (msg: WorkerMessage, transfer: Transferable[] = []) => ctx.postMessage(msg, transfer);

    try {
        let lastReported = 0;
        const mp3 = await encodeMp3(channels, sampleRate, fraction => {
            // Limita a frequência de mensagens para não inundar a thread principal.
            if (fraction - lastReported >= 0.02 || fraction === 1) {
                lastReported = fraction;
                post({ type: 'progress', fraction });
            }
        });
        post({ type: 'done', mp3 }, [mp3.buffer]);
    } catch (err) {
        post({ type: 'error', message: err instanceof Error ? err.message : String(err) });
    }
};

export type { EncodeRequest, WorkerMessage };
